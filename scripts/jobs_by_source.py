"""Print job counts and top matches grouped by source (LinkedIn, Indeed, etc.)."""
import sys
import sqlite3
import os

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

db = "data/jobybot.db"
if not os.path.exists(db):
    print("No database yet. Run: python jobybot.py search")
    sys.exit(0)

c = sqlite3.connect(db)
rows = c.execute(
    """
    SELECT source, COUNT(*) AS n
    FROM jobs WHERE status='found'
    GROUP BY source ORDER BY n DESC
    """
).fetchall()

print("\n  Jobs by website (status=found):\n")
total = 0
for source, n in rows:
    print(f"    {source:14} {n:5}")
    total += n
print(f"    {'TOTAL':14} {total:5}\n")

for source, _ in rows[:5]:
    print(f"  Top 3 — {source}:")
    top = c.execute(
        """
        SELECT match_score, title, company
        FROM jobs WHERE status='found' AND source=?
        ORDER BY match_score DESC LIMIT 3
        """,
        (source,),
    ).fetchall()
    for score, title, company in top:
        print(f"    [{score:3}] {title[:50]} @ {company}")
    print()

c.close()
