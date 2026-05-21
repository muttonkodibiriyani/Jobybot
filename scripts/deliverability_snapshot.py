"""Deliverability snapshot — compare two runs to see if bounces are dropping.

Stores a JSON snapshot in data/snapshots/ each time you run it. Diff two
snapshots to track whether the bounce rate is trending toward zero.

Usage:
    python scripts/_deliverability_snapshot.py          # write a snapshot
    python scripts/_deliverability_snapshot.py --diff   # diff vs previous
"""
from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAP_DIR = ROOT / "data" / "snapshots"
DB_PATH = ROOT / "data" / "jobybot.db"


def collect() -> dict:
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        snap: dict = {
            "taken_at":    datetime.now().isoformat(timespec="seconds"),
            "totals":      {},
            "discovery":   [],
            "bounce_rate": {},
            "top_invalid_recent": [],
        }

        # Totals
        for tbl in ("emails_sent", "invalid_emails", "email_discovery_log",
                    "smtp_probe_cache", "jobs"):
            try:
                n = conn.execute(f"select count(*) from {tbl}").fetchone()[0]
            except sqlite3.OperationalError:
                n = None
            snap["totals"][tbl] = n

        # Discovery tier hit-rates last 7d
        for row in conn.execute(
            """
            select tier, decision, count(*) as n
            from email_discovery_log
            where at > ?
            group by tier, decision
            order by n desc
            """,
            ((datetime.now() - timedelta(days=7)).isoformat(),),
        ):
            snap["discovery"].append({"tier": row[0], "decision": row[1], "n": row[2]})

        # Bounce rate: sent vs bounced last 7 / 14 / 30 days
        for window in (7, 14, 30):
            since = (datetime.now() - timedelta(days=window)).isoformat()
            sent = conn.execute(
                "select count(*) from emails_sent where sent_at > ?", (since,)
            ).fetchone()[0]
            bounced = conn.execute(
                "select count(*) from invalid_emails where bounced_at > ?", (since,)
            ).fetchone()[0] if has_column(conn, "invalid_emails", "bounced_at") else None
            snap["bounce_rate"][f"last_{window}d"] = {
                "sent": sent,
                "bounced": bounced,
                "rate_pct": round(100 * bounced / sent, 2) if (sent and bounced is not None) else None,
            }

        # Top 10 most-recent invalid addresses
        if has_column(conn, "invalid_emails", "bounced_at"):
            for row in conn.execute(
                "select email, reason, bounce_code, bounced_at "
                "from invalid_emails order by bounced_at desc limit 10"
            ):
                snap["top_invalid_recent"].append({
                    "email": row[0], "reason": row[1], "code": row[2], "at": row[3],
                })

    finally:
        conn.close()

    return snap


def has_column(conn: sqlite3.Connection, table: str, col: str) -> bool:
    try:
        cols = [r[1] for r in conn.execute(f"pragma table_info({table})")]
    except sqlite3.OperationalError:
        return False
    return col in cols


def write(snap: dict) -> Path:
    name = snap["taken_at"].replace(":", "-")
    path = SNAP_DIR / f"snap_{name}.json"
    path.write_text(json.dumps(snap, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def main() -> int:
    snap = collect()
    path = write(snap)
    print(f"Snapshot: {path.name}")
    print(f"  emails_sent      : {snap['totals'].get('emails_sent')}")
    print(f"  invalid_emails   : {snap['totals'].get('invalid_emails')}")
    print(f"  discovery_log    : {snap['totals'].get('email_discovery_log')}")
    print(f"  smtp_probe_cache : {snap['totals'].get('smtp_probe_cache')}")
    print("\nBounce rate:")
    for window, b in snap["bounce_rate"].items():
        rate = "n/a" if b["rate_pct"] is None else f"{b['rate_pct']}%"
        print(f"  {window}: sent={b['sent']}  bounced={b['bounced']}  rate={rate}")
    print("\nDiscovery tier hit-rates (last 7d):")
    for r in snap["discovery"][:12]:
        print(f"  tier={r['tier']:14s} decision={r['decision']:24s} n={r['n']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
