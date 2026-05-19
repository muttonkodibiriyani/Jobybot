"""Helper: print stats summary line for the menu (jobs|emails|today|daily_cap)."""
import sys
import sqlite3
import datetime
import os

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from config import get_settings

    daily_cap = get_settings().daily_email_cap
except Exception:
    daily_cap = 200

db = "data/jobybot.db"
if not os.path.exists(db):
    print(f"0|0|0|{daily_cap}")
    sys.exit(0)

try:
    c = sqlite3.connect(db)
    jobs = c.execute("SELECT COUNT(*) FROM jobs WHERE status='found'").fetchone()[0]
    emails = c.execute("SELECT COUNT(*) FROM emails_sent").fetchone()[0]
    today = datetime.date.today().isoformat()
    today_emails = c.execute(
        "SELECT COUNT(*) FROM emails_sent WHERE sent_at LIKE ?",
        (f"{today}%",),
    ).fetchone()[0]
    print(f"{jobs}|{emails}|{today_emails}|{daily_cap}")
    c.close()
except Exception:
    print(f"0|0|0|{daily_cap}")
