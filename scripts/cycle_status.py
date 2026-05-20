"""Print live status of the current bot run by querying the SQLite DB.

Usage:
    py -3 scripts/cycle_status.py
"""
import sqlite3
import sys
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "data" / "jobybot.db"
if not DB.exists():
    print("No DB yet — bot has not run.")
    sys.exit(0)

c = sqlite3.connect(str(DB)).cursor()

def one(q: str) -> int:
    c.execute(q)
    row = c.fetchone()
    return row[0] if row else 0

print("\n  ─── JobyBots — live cycle status ───")
Q_JOBS_TOTAL  = "SELECT COUNT(*) FROM jobs"
Q_JOBS_TODAY  = "SELECT COUNT(*) FROM jobs WHERE date(found_at)=date('now')"
Q_EM_TOTAL    = "SELECT COUNT(*) FROM emails_sent"
Q_EM_TODAY    = "SELECT COUNT(*) FROM emails_sent WHERE date(sent_at)=date('now')"
Q_INVALID     = "SELECT COUNT(*) FROM invalid_emails"
Q_CACHE       = "SELECT COUNT(*) FROM email_cache"
print(f"  Jobs in DB total:        {one(Q_JOBS_TOTAL)}")
print(f"  Jobs added today:        {one(Q_JOBS_TODAY)}")
print(f"  Emails sent total:       {one(Q_EM_TOTAL)}")
print(f"  Emails sent today:       {one(Q_EM_TODAY)}")
print(f"  Bad/bounced emails:      {one(Q_INVALID)}")
print(f"  Cached recruiter emails: {one(Q_CACHE)}")

print("\n  ─── Top 10 jobs scraped today (by AI score) ───")
c.execute("""
    SELECT match_score, title, company, source, location
    FROM jobs
    WHERE date(found_at) = date('now')
    ORDER BY match_score DESC, found_at DESC
    LIMIT 10
""")
rows = c.fetchall()
if not rows:
    print("  (none yet)")
else:
    for s, t, co, src, loc in rows:
        title = (t or "")[:46]
        company = (co or "")[:22]
        print(f"  [{s:>3}]  {title:<46}  {company:<22}  {src}/{loc}")

print("\n  ─── Last 8 emails sent today ───")
c.execute("""
    SELECT sent_at, recipient, company, subject
    FROM emails_sent
    WHERE date(sent_at) = date('now')
    ORDER BY sent_at DESC
    LIMIT 8
""")
rows = c.fetchall()
if not rows:
    print("  (none yet — email phase still warming up; each send has 30-120s delay)")
else:
    for sent_at, rec, co, subj in rows:
        print(f"  {sent_at[:19]}  →  {(rec or '')[:32]:<32}  {(co or '')[:20]:<20}  {(subj or '')[:42]}")

print("\n  ─── Last 5 run-log events ───")
c.execute("SELECT at, event, detail FROM run_log ORDER BY at DESC LIMIT 5")
for at, ev, det in c.fetchall():
    print(f"  {at[:19]}  {ev:<22}  {(det or '')[:60]}")

print()
