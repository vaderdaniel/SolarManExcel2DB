#!/usr/bin/env python3
"""
Fill missing 5-minute inverter records for March 15-16, 2026.

Gap summary (179 missing slots):
  A: 2026-03-15 14:45             (1 isolated slot)
  B: 2026-03-15 21:50 - 23:55    (27 slots, night continuation)
     2026-03-16 00:00 - 12:25    (150 slots, night + solar ramp)
  C: 2026-03-16 13:00             (1 isolated slot)
  D: 2026-03-16 15:30             (1 isolated slot)

Rules for 2026:
  - feed_in = 0 always
  - purchase_power = grid_power when grid_power > 0, else 0
  - charge_power <= 0 (negative = charging), discharge_power >= 0
  - battery_power = charge_power + discharge_power (net)
"""

import psycopg2
import random
import math
from datetime import datetime, timedelta

random.seed(42)  # reproducible

DB = dict(host="localhost", port=15432, dbname="LOOTS", user="danieloots", password="SeweEen0528")

# ---------------------------------------------------------------------------
# Historical hourly reference data (averaged from 2024-03-15/16 and 2025-03-15/16)
# Format: hour -> (avg_prod, avg_consume, avg_grid, avg_battery_net, avg_soc)
# For 2026 we zero out feed_in and clamp purchase accordingly.
# ---------------------------------------------------------------------------

# Night hours (22-05): no solar, battery discharges
# Morning/day hours (06-12): solar ramps up, battery may charge or discharge

# Hourly reference for MAR 15 (night tail 22:00-23:55) from 2024+2025 averages
MAR15_NIGHT = {
    # hr: (prod, consume, battery_net)  - battery_net = discharge if positive
    22: (6,   572, 510),
    23: (11,  576, 390),
}

# Hourly reference for MAR 16 built from 2024 + 2025 averages
# hr: (prod, consume)
MAR16_HOURLY = {
    0:  (9,   551),
    1:  (8,   538),
    2:  (7,   561),
    3:  (9,   586),
    4:  (10,  505),
    5:  (23,  485),
    6:  (94,  619),
    7:  (353, 569),
    8:  (840, 546),
    9:  (1703,547),
    10: (2111,563),
    11: (2386,816),
    12: (2281,791),   # only up to 12:25
}

# SoC trajectory: we know start=62 at 21:45, end=41 at 12:30
# Total gap slots (21:50 to 12:25 inclusive) = 175
# We interpolate SoC linearly, with small noise, and clamp to integers.
GAP_START_DT = datetime(2026, 3, 15, 21, 45)  # last known before gap
GAP_END_DT   = datetime(2026, 3, 16, 12, 30)  # first known after gap
SOC_START    = 62
SOC_END      = 41

def lerp_soc(dt):
    """Linearly interpolate SoC at a given timestamp across the gap."""
    total_seconds = (GAP_END_DT - GAP_START_DT).total_seconds()
    elapsed = (dt - GAP_START_DT).total_seconds()
    frac = max(0.0, min(1.0, elapsed / total_seconds))
    return round(SOC_START + (SOC_END - SOC_START) * frac)

def jitter(val, pct=0.08):
    """Add ±pct random noise to a value, keep non-negative."""
    return max(0.0, val * (1.0 + random.uniform(-pct, pct)))

def round1(v):
    return round(float(v), 1)

def build_row(dt, prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc):
    """Return a tuple matching loots_inverter column order."""
    # Enforce 2026 rules
    feed_in = 0
    purchase = max(0.0, grid) if grid > 0 else 0.0
    return (dt, round1(prod), round1(consume), round1(grid), round1(purchase),
            feed_in, round1(battery), round1(charge), round1(discharge), round1(soc))

# ---------------------------------------------------------------------------
# PHASE 1 — Isolated slots: simple average of neighbours
# ---------------------------------------------------------------------------

def fetch_neighbours(conn, dt):
    before = dt - timedelta(minutes=5)
    after  = dt + timedelta(minutes=5)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT updated, production_power, consume_power, grid_power, purchase_power,
                   feed_in, battery_power, charge_power, discharge_power, soc
            FROM public.loots_inverter
            WHERE updated IN (%s, %s)
            ORDER BY updated
        """, (before, after))
        return cur.fetchall()

def interpolate_isolated(conn, dt):
    rows = fetch_neighbours(conn, dt)
    if len(rows) != 2:
        raise ValueError(f"Expected 2 neighbours for {dt}, got {len(rows)}")
    r1, r2 = rows[0], rows[1]
    # Average columns 1..9 (skip updated at index 0)
    vals = [(float(r1[i]) + float(r2[i])) / 2.0 for i in range(1, 10)]
    prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc = vals
    return build_row(dt, prod, consume, grid, purchase, 0, battery, charge, discharge, round(soc))

# ---------------------------------------------------------------------------
# PHASE 2 — Night block: 2026-03-15 21:50 through 2026-03-16 05:55
# Battery-only, no solar, SoC declines.
# ---------------------------------------------------------------------------

def gen_night_slot(dt):
    hr = dt.hour
    # Use reference consume for this hour (fallback to ~500)
    if hr in MAR15_NIGHT:
        ref_prod, ref_consume, _ = MAR15_NIGHT[hr]
    elif hr in MAR16_HOURLY:
        ref_prod, ref_consume = MAR16_HOURLY[hr]
    else:
        ref_prod, ref_consume = 8, 490

    prod    = jitter(ref_prod, 0.20)
    consume = jitter(ref_consume, 0.08)
    grid    = 0.0
    purchase= 0.0
    feed_in = 0
    # Battery discharges to cover load
    discharge = max(0.0, consume - prod)
    charge    = 0.0
    battery   = discharge   # positive = discharging
    soc       = lerp_soc(dt)
    return build_row(dt, prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc)

# ---------------------------------------------------------------------------
# PHASE 3 — Solar ramp block: 2026-03-16 06:00 through 12:25
# Solar rises, battery transitions discharge→charge, grid overhead ~36W.
# ---------------------------------------------------------------------------

def gen_solar_slot(dt):
    hr = dt.hour
    ref_prod, ref_consume = MAR16_HOURLY.get(hr, (500, 600))

    prod    = jitter(ref_prod, 0.12)
    consume = jitter(ref_consume, 0.08)
    grid_overhead = jitter(37, 0.05)   # small grid draw observed in real data

    # Energy balance: prod + grid_overhead → consume + battery_net
    # battery_net < 0 means charging
    battery_net = -(prod + grid_overhead - consume)

    if battery_net < 0:
        # Charging (battery_net is negative)
        charge    = battery_net          # negative
        discharge = 0.0
    else:
        charge    = 0.0
        discharge = battery_net          # positive

    battery = charge + discharge         # net: negative=charging, positive=discharging

    # In practice grid_power is the small overhead draw
    grid     = grid_overhead if battery_net <= 0 else grid_overhead
    purchase = grid  # grid > 0, no export in 2026

    soc = lerp_soc(dt)
    return build_row(dt, prod, consume, grid, purchase, 0, battery, charge, discharge, soc)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def generate_all_rows(conn):
    rows = []

    # A: isolated 14:45 Mar 15
    rows.append(interpolate_isolated(conn, datetime(2026, 3, 15, 14, 45)))

    # B1: night tail  Mar 15 21:50 - 23:55
    t = datetime(2026, 3, 15, 21, 50)
    while t <= datetime(2026, 3, 15, 23, 55):
        rows.append(gen_night_slot(t))
        t += timedelta(minutes=5)

    # B2: night/morning Mar 16 00:00 - 05:55
    t = datetime(2026, 3, 16, 0, 0)
    while t <= datetime(2026, 3, 16, 5, 55):
        rows.append(gen_night_slot(t))
        t += timedelta(minutes=5)

    # B3: solar ramp Mar 16 06:00 - 12:25
    t = datetime(2026, 3, 16, 6, 0)
    while t <= datetime(2026, 3, 16, 12, 25):
        rows.append(gen_solar_slot(t))
        t += timedelta(minutes=5)

    # C: isolated 13:00 Mar 16
    rows.append(interpolate_isolated(conn, datetime(2026, 3, 16, 13, 0)))

    # D: isolated 15:30 Mar 16
    rows.append(interpolate_isolated(conn, datetime(2026, 3, 16, 15, 30)))

    return rows

def validate(rows):
    errors = []
    for r in rows:
        dt, prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc = r
        if feed_in != 0:
            errors.append(f"{dt}: feed_in={feed_in} (must be 0)")
        if purchase < 0:
            errors.append(f"{dt}: purchase={purchase} (must be >= 0)")
        if discharge < 0:
            errors.append(f"{dt}: discharge={discharge} (must be >= 0)")
        if charge > 0:
            errors.append(f"{dt}: charge={charge} (must be <= 0 or 0)")
        if not (0 <= soc <= 100):
            errors.append(f"{dt}: soc={soc} out of range")
    return errors

def insert_rows(conn, rows):
    sql = """
        INSERT INTO public.loots_inverter
            (updated, production_power, consume_power, grid_power, purchase_power,
             feed_in, battery_power, charge_power, discharge_power, soc)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (updated) DO NOTHING
    """
    with conn.cursor() as cur:
        cur.executemany(sql, rows)
    conn.commit()

if __name__ == "__main__":
    conn = psycopg2.connect(**DB)
    try:
        print("Generating rows...")
        rows = generate_all_rows(conn)
        print(f"Generated {len(rows)} rows")

        # Print sample
        print("\nSample rows (first 5, last 5):")
        for r in rows[:5] + rows[-5:]:
            print(f"  {r[0]}  prod={r[1]:7.1f}  consume={r[2]:7.1f}  grid={r[3]:7.1f}  "
                  f"batt={r[6]:7.1f}  charge={r[7]:7.1f}  discharge={r[8]:7.1f}  soc={r[9]}")

        print("\nValidating...")
        errors = validate(rows)
        if errors:
            print("VALIDATION ERRORS:")
            for e in errors:
                print(f"  {e}")
            raise SystemExit("Aborting due to validation errors.")
        print(f"Validation passed ({len(rows)} rows OK)")

        print("\nInserting into database...")
        insert_rows(conn, rows)
        print("Insert complete.")

        # Verify gap is closed
        with conn.cursor() as cur:
            cur.execute("""
                WITH slots AS (
                  SELECT generate_series('2026-03-15 00:00:00'::timestamp,
                                         '2026-03-16 23:55:00'::timestamp,
                                         interval '5 minutes') AS ts
                ),
                existing AS (
                  SELECT updated FROM public.loots_inverter
                  WHERE updated >= '2026-03-15' AND updated < '2026-03-17'
                )
                SELECT COUNT(*) FROM slots s
                LEFT JOIN existing e ON e.updated = s.ts
                WHERE e.updated IS NULL
            """)
            remaining = cur.fetchone()[0]
        print(f"\nRemaining missing slots for Mar 15-16: {remaining}")
        if remaining == 0:
            print("✅ Gap fully closed!")
        else:
            print(f"⚠️  {remaining} slots still missing — check output above.")

    finally:
        conn.close()
