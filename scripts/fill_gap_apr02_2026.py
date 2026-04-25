#!/usr/bin/env python3
"""
Fill missing 5-minute inverter records for April 2, 2026.

Gap summary (55 missing slots):
  A: 2026-04-02 02:25 - 06:30  (50 slots, night/dawn block)
  B: 2026-04-02 06:50           (1 isolated)
  C: 2026-04-02 11:35           (1 isolated)
  D: 2026-04-02 17:25           (1 isolated)
  E: 2026-04-02 20:20           (1 isolated)
  F: 2026-04-02 23:25           (1 isolated)

Boundary context:
  Last before block: 02:20 -> SoC 50, battery discharge 545W, no grid, no solar
  First after block: 06:35 -> SoC 32, battery discharge 580W, no grid, solar 33W

Rules for 2026:
  - feed_in = 0 always
  - purchase_power = grid_power when grid_power > 0, else 0
  - charge_power <= 0 (negative = charging), discharge_power >= 0
"""

import psycopg2
import random
from datetime import datetime, timedelta

random.seed(99)

DB = dict(host="localhost", port=15432, dbname="LOOTS", user="danieloots", password="SeweEen0528")

# ---------------------------------------------------------------------------
# Hourly reference: average of 2024-04-02, 2025-04-02, 2026-04-01, 2026-04-03
# for hours 2-6 (the gap period). Weighted towards 2026 neighbours.
# hr: (avg_prod, avg_consume)
# ---------------------------------------------------------------------------
HOURLY_REF = {
    2: (12,  513),   # ~midnight-ish, low prod, moderate consume
    3: (10,  508),
    4: (11,  568),
    5: (17,  1020),  # 05:xx often has a load spike (geyser etc)
    6: (82,  703),   # dawn - solar starts
}

# Boundary SoC: 50 at 02:20, 32 at 06:35
GAP_START_DT = datetime(2026, 4, 2,  2, 20)
GAP_END_DT   = datetime(2026, 4, 2,  6, 35)
SOC_START    = 50
SOC_END      = 32

def lerp_soc(dt):
    total = (GAP_END_DT - GAP_START_DT).total_seconds()
    elapsed = (dt - GAP_START_DT).total_seconds()
    frac = max(0.0, min(1.0, elapsed / total))
    return round(SOC_START + (SOC_END - SOC_START) * frac)

def jitter(val, pct=0.08):
    return max(0.0, val * (1.0 + random.uniform(-pct, pct)))

def round1(v):
    return round(float(v), 1)

def build_row(dt, prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc):
    feed_in  = 0
    purchase = max(0.0, float(grid)) if float(grid) > 0 else 0.0
    return (dt, round1(prod), round1(consume), round1(grid), round1(purchase),
            feed_in, round1(battery), round1(charge), round1(discharge), round1(soc))

# ---------------------------------------------------------------------------
# Isolated slot: average of the two neighbours
# ---------------------------------------------------------------------------
def interpolate_isolated(conn, dt):
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
        rows = cur.fetchall()
    if len(rows) != 2:
        raise ValueError(f"Expected 2 neighbours for {dt}, got {len(rows)}")
    r1, r2 = rows[0], rows[1]
    vals = [(float(r1[i]) + float(r2[i])) / 2.0 for i in range(1, 10)]
    prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc = vals
    return build_row(dt, prod, consume, grid, purchase, 0, battery, charge, discharge, round(soc))

# ---------------------------------------------------------------------------
# Night/dawn block: battery-only, SoC declines, solar starts at ~06:00
# ---------------------------------------------------------------------------
def gen_block_slot(dt):
    hr = dt.hour
    ref_prod, ref_consume = HOURLY_REF.get(hr, (12, 500))

    prod    = jitter(ref_prod, 0.20)
    consume = jitter(ref_consume, 0.08)

    # No grid draw during this pre-dawn window (matches neighbours 02:20 and 06:35)
    grid     = 0.0
    purchase = 0.0
    feed_in  = 0

    discharge = max(0.0, consume - prod)
    charge    = 0.0
    battery   = discharge

    soc = lerp_soc(dt)
    return build_row(dt, prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def generate_all_rows(conn):
    rows = []

    # A: continuous block 02:25 - 06:30
    t = datetime(2026, 4, 2, 2, 25)
    while t <= datetime(2026, 4, 2, 6, 30):
        rows.append(gen_block_slot(t))
        t += timedelta(minutes=5)

    # B-F: isolated slots
    for iso_dt in [
        datetime(2026, 4, 2,  6, 50),
        datetime(2026, 4, 2, 11, 35),
        datetime(2026, 4, 2, 17, 25),
        datetime(2026, 4, 2, 20, 20),
        datetime(2026, 4, 2, 23, 25),
    ]:
        rows.append(interpolate_isolated(conn, iso_dt))

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
            errors.append(f"{dt}: charge={charge} (must be <= 0)")
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

        print("\nSample rows (first 5, last 5):")
        for r in rows[:5] + rows[-5:]:
            print(f"  {r[0]}  prod={r[1]:7.1f}  consume={r[2]:7.1f}  grid={r[3]:5.1f}  "
                  f"discharge={r[8]:6.1f}  charge={r[7]:7.1f}  soc={r[9]}")

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
                  SELECT generate_series('2026-04-02 00:00:00'::timestamp,
                                         '2026-04-02 23:55:00'::timestamp,
                                         interval '5 minutes') AS ts
                ),
                existing AS (
                  SELECT updated FROM public.loots_inverter
                  WHERE updated >= '2026-04-02' AND updated < '2026-04-03'
                )
                SELECT COUNT(*) FROM slots s
                LEFT JOIN existing e ON e.updated = s.ts
                WHERE e.updated IS NULL
            """)
            remaining = cur.fetchone()[0]
        print(f"\nRemaining missing slots for Apr 2: {remaining}")
        if remaining == 0:
            print("✅ Gap fully closed!")
        else:
            print(f"⚠️  {remaining} slots still missing.")

    finally:
        conn.close()
