"""Emails to a company: python scripts/emails_by_company.py Deloitte"""
import os
import sqlite3
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

company = sys.argv[1] if len(sys.argv) > 1 else "Deloitte"
db = os.path.join("data", "jobybot.db")
if not os.path.exists(db):
    print("(No emails database yet)")
    sys.exit(0)

c = sqlite3.connect(db)
rows = c.execute(
    """
    SELECT sent_at, recipient FROM emails_sent
    WHERE company LIKE ? ORDER BY sent_at DESC
    """,
    ("%" + company + "%",),
).fetchall()
if not rows:
    print(f"No emails found for company matching: {company}")
else:
    for r in rows:
        print(f"{(r[0] or '')[:19]}  {r[1]}")
c.close()
