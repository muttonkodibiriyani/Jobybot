"""Helper: print last 20 emails sent."""
import sys
import sqlite3
import os

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

db = os.path.join("data", "jobybot.db")
if not os.path.exists(db):
    print("(No emails sent yet)")
    sys.exit(0)

c = sqlite3.connect(db)
rows = c.execute(
    "SELECT sent_at, company, recipient, category FROM emails_sent "
    "ORDER BY sent_at DESC LIMIT 20"
).fetchall()

if not rows:
    print("(No emails sent yet)")
else:
    print(f"  Last {len(rows)} emails sent (with CV attached):")
    print("  " + "─" * 75)
    for r in rows:
        ts = (r[0] or "")[:19]
        company = (r[1] or "")[:28]
        rcpt = (r[2] or "")[:30]
        cat = (r[3] or "")[:10]
        print(f"  {ts} | [{cat:10s}] {company:28s} → {rcpt}")
    print()
    total = c.execute("SELECT COUNT(*) FROM emails_sent").fetchone()[0]
    print(f"  (Total emails sent overall: {total})")

c.close()
