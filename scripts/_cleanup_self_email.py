"""Quarantine the customer's own email + remove poisoned cache rows.

The old T2 LinkedIn finder grabbed the FIRST email on a profile page and
attributed it to whichever company we happened to be looking at. Because
LinkedIn shows YOUR own profile signature on every page you visit while
logged in, we ended up caching `tarakesh.reddy89@gmail.com` as the
recruiter address for ~21 different companies.

This script:
  1. Adds the user's gmail to `invalid_emails` so the validator will
     refuse to send to it ever again.
  2. Wipes any `email_cache` row whose `resolved_email` is the user's own.
  3. Wipes any `email_cache` row pointing to a free-mail provider
     (those are never recruiter work addresses).
  4. Prints a clean before/after for transparency.
"""
import _root  # noqa: F401
import sqlite3

from config import get_settings
from core import db

s = get_settings()
own = (s.gmail_address or s.user_email or "").lower().strip()
print(f"\n  Quarantining self-email: {own}\n")

c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row

# 1. Show what's polluted
polluted = c.execute(
    "SELECT COUNT(*) AS n FROM email_cache WHERE LOWER(resolved_email) = ?",
    (own,)
).fetchone()["n"]
print(f"  email_cache rows pointing to your own gmail: {polluted}")
free = c.execute(
    "SELECT COUNT(*) AS n FROM email_cache WHERE "
    "resolved_email LIKE '%@gmail.com' OR resolved_email LIKE '%@yahoo.com' OR "
    "resolved_email LIKE '%@hotmail.com' OR resolved_email LIKE '%@outlook.com'"
).fetchone()["n"]
print(f"  email_cache rows pointing to free-mail provider: {free}")

# 2. Quarantine the user's own email so the validator/sender refuses it
db.mark_invalid_email(own, "self_email_quarantine", "blocked")
print(f"  Added {own} to invalid_emails table (will never be sent to).")

# 3. Wipe poisoned cache rows
with sqlite3.connect("data/jobybot.db") as cw:
    cw.execute(
        "DELETE FROM email_cache WHERE LOWER(resolved_email) = ?",
        (own,)
    )
    cw.execute(
        "DELETE FROM email_cache WHERE "
        "resolved_email LIKE '%@gmail.com' OR resolved_email LIKE '%@yahoo.com' OR "
        "resolved_email LIKE '%@hotmail.com' OR resolved_email LIKE '%@outlook.com' OR "
        "resolved_email LIKE '%@icloud.com' OR resolved_email LIKE '%@protonmail.com'"
    )
    cw.commit()
print(f"  Wiped {polluted + free} poisoned cache rows.")

# 4. Verify clean
after = c.execute(
    "SELECT COUNT(*) AS n FROM email_cache WHERE LOWER(resolved_email) = ?",
    (own,)
).fetchone()["n"]
print(f"\n  email_cache pointing to your own gmail after cleanup: {after}")
print("  Done.\n")
