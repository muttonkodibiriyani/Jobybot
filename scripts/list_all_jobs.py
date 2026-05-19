"""List all matched jobs (for PowerShell — no inline -c)."""
import os
import sqlite3
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

db = os.path.join("data", "jobybot.db")
if not os.path.exists(db):
    print("(No database — run: python jobybot.py search)")
    sys.exit(0)

c = sqlite3.connect(db)
rows = c.execute(
    """
    SELECT match_score, source, title, company, location
    FROM jobs WHERE status='found'
    ORDER BY match_score DESC
    """
).fetchall()
for r in rows:
    title = (r[2] or "")[:45]
    print(f"[{r[0]:3}] {r[1]:12} | {title:45} @ {r[3]} | {r[4] or ''}")
print(f"\nTotal: {len(rows)} jobs")
c.close()
