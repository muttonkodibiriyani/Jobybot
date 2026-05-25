"""Check whether we EVER actually sent to a free-mail address (would be a bug)."""
import _root  # noqa: F401
import sqlite3

c = sqlite3.connect("data/jobybot.db")
n = c.execute(
    "SELECT COUNT(*) FROM emails_sent WHERE "
    "LOWER(recipient) LIKE '%@gmail.com' OR LOWER(recipient) LIKE '%@yahoo.com' "
    "OR LOWER(recipient) LIKE '%@hotmail.com' OR LOWER(recipient) LIKE '%@outlook.com'"
).fetchone()[0]
print(f"\n  Free-mail addresses ever actually sent to: {n}")
rows = c.execute(
    "SELECT recipient, company, sent_at FROM emails_sent WHERE "
    "LOWER(recipient) LIKE '%@gmail.com' OR LOWER(recipient) LIKE '%@yahoo.com' "
    "OR LOWER(recipient) LIKE '%@hotmail.com' OR LOWER(recipient) LIKE '%@outlook.com' "
    "ORDER BY sent_at DESC LIMIT 10"
).fetchall()
for r in rows:
    print(f"    {r[2][:19]}  {r[0]:<35s} {r[1]}")
