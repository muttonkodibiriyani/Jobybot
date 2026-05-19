"""Helper: print top 20 highest-matched jobs."""
import sys, sqlite3, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

db = "data/jobybot.db"
if not os.path.exists(db):
    print("(No jobs database yet — run the bot first)")
    sys.exit(0)

c = sqlite3.connect(db)
rows = c.execute(
    "SELECT match_score, title, company, source FROM jobs "
    "WHERE status='found' ORDER BY match_score DESC LIMIT 20"
).fetchall()

if not rows:
    print("(No jobs found yet — run option 10 to search)")
else:
    print(f"  Top {len(rows)} matched jobs:")
    print("  " + "─" * 70)
    for r in rows:
        title = (r[1] or "")[:48]
        company = (r[2] or "")[:25]
        print(f"  [{r[0]:>3}] {title:48s} @ {company:25s} ({r[3]})")
    print()
    total = c.execute("SELECT COUNT(*) FROM jobs WHERE status='found'").fetchone()[0]
    print(f"  (Total jobs in database: {total})")

c.close()
