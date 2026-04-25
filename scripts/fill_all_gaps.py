#!/usr/bin/env python3
"""
Fill ALL gaps in public.loots_inverter by scanning consecutive row pairs.

Strategy by gap size:
  1 slot  (isolated):   average of the two neighbours
  2-11    (small block): linear interpolation across all columns
  12+     (medium block): historical (month, hour) averages + linear SoC + ±8% jitter

Year-specific rules:
  year >= 2026: feed_in = 0; purchase_power = max(0, grid_power)
  earlier years: use historical feed_in averages as-is

Note: only fills gaps BETWEEN existing rows (pre-data and post-data gaps are left untouched).
"""

import psycopg2
import random
from datetime import datetime, timedelta

random.seed(2026)

DB = dict(host="localhost", port=15432, dbname="LOOTS",
          user="danieloots", password="SeweEen0528")

INTERVAL = timedelta(minutes=5)
COL_NAMES = ["updated", "production_power", "consume_power", "grid_power",
             "purchase_power", "feed_in", "battery_power", "charge_power",
             "discharge_power", "soc"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def to_f(v):
    return 0.0 if v is None else float(v)

def r1(v):
    return round(float(v), 1)

def lerp(a, b, t):
    return a + (b - a) * t

def jitter(v, pct=0.08):
    return max(0.0, v * (1.0 + random.uniform(-pct, pct)))

def apply_year_rules(year, grid, purchase, feed_in):
    """Enforce 2026+ rules: no feed_in, purchase = grid when positive."""
    if year >= 2026:
        feed_in  = 0.0
        purchase = max(0.0, grid) if grid > 0 else 0.0
    return purchase, feed_in

def make_row(dt, prod, consume, grid, purchase, feed_in, battery, charge, discharge, soc):
    purchase, feed_in = apply_year_rules(dt.year, grid, purchase, feed_in)
    soc = max(0.0, min(100.0, soc))
    return (dt, r1(prod), r1(consume), r1(grid), r1(purchase),
            r1(feed_in), r1(battery), r1(charge), r1(discharge), round(soc))

def row_dict(raw):
    keys = ["updated", "prod", "consume", "grid", "purchase",
            "feed_in", "battery", "charge", "discharge", "soc"]
    return dict(zip(keys, [raw[0]] + [to_f(x) for x in raw[1:]]))

# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------

def fetch_historical_averages(conn):
    """Load (month, hour) averages from the full existing dataset."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
              EXTRACT(month FROM updated)::int,
              EXTRACT(hour  FROM updated)::int,
              AVG(production_power), AVG(consume_power),  AVG(grid_power),
              AVG(purchase_power),   AVG(feed_in),        AVG(battery_power),
              AVG(charge_power),     AVG(discharge_power), AVG(soc)
            FROM public.loots_inverter
            GROUP BY 1, 2
            ORDER BY 1, 2
        """)
        avgs = {}
        for row in cur.fetchall():
            mo, hr = int(row[0]), int(row[1])
            avgs[(mo, hr)] = dict(zip(
                ["prod","consume","grid","purchase","feed_in",
                 "battery","charge","discharge","soc"],
                [to_f(v) for v in row[2:]]
            ))
    return avgs

def fetch_all_rows(conn):
    """Fetch all rows ordered by timestamp."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT updated, production_power, consume_power, grid_power,
                   purchase_power, feed_in, battery_power, charge_power,
                   discharge_power, soc
            FROM public.loots_inverter
            ORDER BY updated
        """)
        return cur.fetchall()

# ---------------------------------------------------------------------------
# Gap-filling strategies
# ---------------------------------------------------------------------------

def fill_isolated(before, after):
    """Single missing slot: midpoint average of neighbours."""
    dt = before["updated"] + INTERVAL
    vals = {k: (before[k] + after[k]) / 2.0
            for k in ["prod","consume","grid","purchase","feed_in",
                      "battery","charge","discharge","soc"]}
    return [make_row(dt, **{k: vals[k] for k in
                            ["prod","consume","grid","purchase","feed_in",
                             "battery","charge","discharge","soc"]})]

def fill_linear_block(before, after, n_slots):
    """2–11 slots: smooth linear interpolation across all numeric columns."""
    rows = []
    dt = before["updated"] + INTERVAL
    cols = ["prod","consume","grid","purchase","feed_in",
            "battery","charge","discharge","soc"]
    for i in range(1, n_slots + 1):
        t = i / (n_slots + 1)
        v = {k: lerp(before[k], after[k], t) for k in cols}
        rows.append(make_row(dt, v["prod"], v["consume"], v["grid"],
                             v["purchase"], v["feed_in"], v["battery"],
                             v["charge"], v["discharge"], v["soc"]))
        dt += INTERVAL
    return rows

def fill_historical_block(before, after, n_slots, hist):
    """12+ slots: historical (month, hour) shape + linear SoC + jitter."""
    rows = []
    dt = before["updated"] + INTERVAL
    soc_a, soc_b = before["soc"], after["soc"]

    for i in range(1, n_slots + 1):
        t = i / (n_slots + 1)
        mo, hr = dt.month, dt.hour
        h = hist.get((mo, hr), {})

        prod      = jitter(h.get("prod",      10),  0.12)
        consume   = jitter(h.get("consume",  500),  0.08)
        grid      = jitter(h.get("grid",       0),  0.10) if h.get("grid", 0) != 0 else 0.0
        purchase  = jitter(h.get("purchase",   0),  0.10) if h.get("purchase", 0) != 0 else 0.0
        feed_in   = jitter(h.get("feed_in",    0),  0.10) if h.get("feed_in", 0) != 0 else 0.0
        battery   = jitter(abs(h.get("battery",  0)), 0.10) * (1 if h.get("battery", 0) >= 0 else -1)
        charge    = jitter(abs(h.get("charge",   0)), 0.10) * (1 if h.get("charge",   0) >= 0 else -1)
        discharge = jitter(h.get("discharge",  0),  0.10)
        soc       = lerp(soc_a, soc_b, t)

        rows.append(make_row(dt, prod, consume, grid, purchase, feed_in,
                             battery, charge, discharge, soc))
        dt += INTERVAL
    return rows

# ---------------------------------------------------------------------------
# Main scan and fill
# ---------------------------------------------------------------------------

def find_and_fill_all(all_rows, hist):
    """Walk consecutive row pairs, detect gaps, generate fill rows."""
    generated = []
    stats = dict(isolated=0, small=0, medium=0, total_slots=0, skipped=0)

    for i in range(len(all_rows) - 1):
        before = row_dict(all_rows[i])
        after  = row_dict(all_rows[i + 1])

        delta_sec = (after["updated"] - before["updated"]).total_seconds()
        if delta_sec <= 300:
            continue  # no gap

        n_slots = int(delta_sec / 300) - 1
        if n_slots <= 0:
            continue

        if n_slots == 1:
            rows = fill_isolated(before, after)
            stats["isolated"] += 1
        elif n_slots <= 11:
            rows = fill_linear_block(before, after, n_slots)
            stats["small"] += 1
        else:
            rows = fill_historical_block(before, after, n_slots, hist)
            stats["medium"] += 1

        stats["total_slots"] += len(rows)
        generated.extend(rows)

    return generated, stats

def insert_all(conn, rows, batch_size=500):
    sql = """
        INSERT INTO public.loots_inverter
            (updated, production_power, consume_power, grid_power, purchase_power,
             feed_in, battery_power, charge_power, discharge_power, soc)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (updated) DO NOTHING
    """
    inserted = 0
    with conn.cursor() as cur:
        for i in range(0, len(rows), batch_size):
            cur.executemany(sql, rows[i:i + batch_size])
            conn.commit()
            inserted += min(batch_size, len(rows) - i)
            print(f"  Inserted {inserted:,}/{len(rows):,}...", end="\r")
    print()
    return inserted

def verify(conn):
    """Count remaining gaps between consecutive rows."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*) AS gaps, COALESCE(SUM(gap_slots), 0) AS total_slots
            FROM (
                SELECT
                    (EXTRACT(epoch FROM
                        (LEAD(updated) OVER (ORDER BY updated) - updated)
                    ) / 300)::int - 1 AS gap_slots
                FROM public.loots_inverter
            ) t
            WHERE gap_slots > 0
        """)
        return cur.fetchone()

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    conn = psycopg2.connect(**DB)
    try:
        print("Fetching historical (month, hour) averages...")
        hist = fetch_historical_averages(conn)
        print(f"  Loaded {len(hist)} reference entries  ({len(hist)//12} months × 24 hours)")

        print("\nFetching all existing rows (this may take a moment)...")
        all_rows = fetch_all_rows(conn)
        print(f"  Loaded {len(all_rows):,} rows  "
              f"({all_rows[0][0].date()} → {all_rows[-1][0].date()})")

        print("\nScanning for gaps and generating fill rows...")
        new_rows, stats = find_and_fill_all(all_rows, hist)
        print(f"  Isolated (1 slot):     {stats['isolated']:>5,}")
        print(f"  Small blocks (2-11):   {stats['small']:>5,}")
        print(f"  Medium blocks (12+):   {stats['medium']:>5,}")
        print(f"  ─────────────────────────────")
        print(f"  Total new slots:       {stats['total_slots']:>5,}")

        print("\nInserting into database...")
        insert_all(conn, new_rows)

        print("\nVerifying (checking remaining gaps between rows)...")
        gaps_left, slots_left = verify(conn)
        print(f"  Remaining gap events:  {gaps_left}")
        print(f"  Remaining missing slots: {slots_left}")
        if gaps_left == 0:
            print("\n✅ All between-row gaps filled!")
        else:
            print(f"\n⚠️  {gaps_left} gap events ({slots_left} slots) remain.")
    finally:
        conn.close()
