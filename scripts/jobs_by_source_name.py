"""List jobs for one source: python scripts/jobs_by_source_name.py LinkedIn"""
import os
import sqlite3
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

source = sys.argv[1] if len(sys.argv) > 1 else "LinkedIn"
db = os.path.join("data", "jobybot.db")
if not os.path.exists(db):
    print(f"(No database — cannot list {source} jobs)")
    sys.exit(0)

c = sqlite3.connect(db)
rows = c.execute(
    """
    SELECT match_score, title, company, url
    FROM jobs WHERE source=? AND status='found'
    ORDER BY match_score DESC LIMIT 30
    """,
    (source,),
).fetchall()
if not rows:
    print(f"No jobs for source: {source}")
else:
    for r in rows:
        print(f"[{r[0]}] {r[1]} @ {r[2]}")
        print(f"  {r[3]}\n")
c.close()
