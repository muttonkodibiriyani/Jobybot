"""Diagnose the depleted-markets problem.

Shows: how many contacts have been emailed, how old the sends are, and
whether followups would unlock fresh sends today.
"""
import _root  # noqa: F401
import datetime as dt
import sqlite3

from core import db
from config import get_settings

db.init_db()
s = get_settings()

c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row

print()
print("  MARKETS POOL DIAGNOSIS")
print("  " + "=" * 60)

# 1. How many distinct recipients have we ever emailed?
n_recipients = c.execute(
    "SELECT COUNT(DISTINCT recipient) AS n FROM emails_sent WHERE followup=0"
).fetchone()["n"]
print(f"\n  Distinct recipients ever emailed (followup=0): {n_recipients}")

# 2. Of those, how many have a follow-up already?
n_followed = c.execute(
    "SELECT COUNT(DISTINCT recipient) AS n FROM emails_sent WHERE followup=1"
).fetchone()["n"]
print(f"  Distinct recipients with follow-up sent       : {n_followed}")

# 3. How many are eligible for follow-up today, by lookback days?
print()
print("  Followup eligibility curve  (lower N = more aggressive)")
print("  " + "-" * 50)
for d in (3, 5, 7, 10, 14, 21, 30):
    cutoff = (dt.datetime.utcnow() - dt.timedelta(days=d)).isoformat()
    n = c.execute(
        "SELECT COUNT(*) AS n FROM emails_sent WHERE followup=0 AND sent_at < ? "
        "AND recipient NOT IN (SELECT recipient FROM emails_sent WHERE followup=1)",
        (cutoff,),
    ).fetchone()["n"]
    marker = "<-- current setting" if d == s.followup_days else ""
    print(f"    Followup older than {d:2d} days: {n:4d} eligible   {marker}")

# 4. Oldest and newest sends in the table
oldest = c.execute(
    "SELECT MIN(sent_at) AS at FROM emails_sent WHERE followup=0"
).fetchone()["at"]
newest = c.execute(
    "SELECT MAX(sent_at) AS at FROM emails_sent WHERE followup=0"
).fetchone()["at"]
print(f"\n  Oldest send: {oldest}")
print(f"  Newest send: {newest}")

# 5. Are there contacts in the markets JSON files that DON'T appear in
# emails_sent at all (fresh, never-touched)?
import json
from pathlib import Path
contacts_in_markets = set()
for f in Path("markets").glob("*.json"):
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    for k in ("email", "contact_email", "hr_email"):
                        v = item.get(k)
                        if v and "@" in str(v):
                            contacts_in_markets.add(str(v).lower().strip())
                            break
    except Exception as e:
        print(f"  (could not parse {f.name}: {e})")

contacts_ever_sent = {r["recipient"].lower() for r in c.execute(
    "SELECT DISTINCT recipient FROM emails_sent WHERE followup=0"
).fetchall()}

fresh = contacts_in_markets - contacts_ever_sent
print(f"\n  Total contacts in markets/*.json     : {len(contacts_in_markets)}")
print(f"  Contacts NEVER emailed (fresh pool)  : {len(fresh)}")
if fresh:
    print("  Sample fresh contacts:")
    for x in sorted(list(fresh))[:5]:
        print(f"    - {x}")

# 6. Verdict + suggested action
print()
print("  ACTION TO RESTORE FLOW")
print("  " + "-" * 50)
if len(fresh) > 50:
    print(f"  -> {len(fresh)} untouched contacts in markets/ are ready to send.")
    print("     Restart the bot and it will email them on the next cycle.")
elif n_recipients >= 100:
    elig = c.execute(
        "SELECT COUNT(*) AS n FROM emails_sent WHERE followup=0 AND sent_at < ? "
        "AND recipient NOT IN (SELECT recipient FROM emails_sent WHERE followup=1)",
        ((dt.datetime.utcnow() - dt.timedelta(days=3)).isoformat(),),
    ).fetchone()["n"]
    print(f"  -> Market pool is depleted ({n_recipients} contacts already emailed).")
    print(f"     Lowering FOLLOWUP_DAYS from {s.followup_days} -> 3 unlocks "
          f"{elig} follow-up sends. Run: jobybot relax-followups --days 3")
else:
    print("  -> Discovery is the bottleneck. The bot needs to find new")
    print("     recruiter emails from search results. Email-finder hit rate")
    print("     needs to improve (currently around 3%).")
print()
