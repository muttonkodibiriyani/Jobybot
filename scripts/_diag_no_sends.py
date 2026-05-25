"""Diagnose 'no emails sent for 2 days' — show the bug + the fix in one report."""
import _root  # noqa: F401
import datetime as dt
import sqlite3

from core import db, scheduler_lock
from config import get_settings

c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row
db.init_db()
s = get_settings()

print()
print("  WHY NO EMAILS HAVE BEEN SENT  (root-cause investigation)")
print("  " + "=" * 60)

# 1. Scheduler status
alive, pid = scheduler_lock.is_alive()
print()
print("  1. Scheduler daemon (background process)")
print(f"     status     : {'RUNNING (pid '+str(pid)+')' if alive else '*** DEAD ***'}")

# 2. Recent activity
rows = c.execute(
    "SELECT event, detail, at FROM run_log "
    "WHERE at >= datetime('now', '-3 days') "
    "AND event IN ('search_done','blast_done','blast_start','email_sent',"
    "             'email_failed','email_sent_from_queue','heartbeat',"
    "             'license_check','license_blocked') "
    "ORDER BY at DESC LIMIT 25"
).fetchall()
print()
print("  2. Last 25 cycle-related events (since 3 days ago)")
if not rows:
    print("     (NONE - the bot has been idle for 3+ days)")
else:
    for r in rows:
        print(f"     {r['at'][:19]}  {r['event']:<24s} {(r['detail'] or '')[:60]}")

# 3. The configuration that decides whether emails fly
print()
print("  3. The 3 settings that decide whether the bot sends emails")
print(f"     DRAFT_MODE          = {s.draft_mode}")
print(f"     {'  -> emails are QUEUED for manual review (you must click Send)' if s.draft_mode else '  -> emails are AUTO-SENT (no review)'}")
print(f"     DAILY_EMAIL_CAP     = {s.daily_email_cap}   (max per day)")
print(f"     RUN_INTERVAL_MINUTES= {s.run_interval_minutes}   (how often cycle runs)")
print(f"     ENABLE_EASY_APPLY   = {s.enable_easy_apply}")
print(f"     {'  -> LinkedIn Easy Apply OFF by default' if not s.enable_easy_apply else '  -> LinkedIn Easy Apply ON'}")

# 4. Timezone audit
print()
print("  4. Timezone audit  (your 9 AM UAE wish)")
print(f"     System time       : {dt.datetime.now()}")
print(f"     UTC time          : {dt.datetime.utcnow()}")
print(f"     UAE (UTC+4) time  : {dt.datetime.utcnow() + dt.timedelta(hours=4)}")

# Check what the APScheduler is actually configured to
import re
sched_file = open("jobybot.py", encoding="utf-8").read()
m = re.search(r'BlockingScheduler\(timezone=["\']([^"\']+)["\']\)', sched_file)
if m:
    print(f"     APScheduler tz    : '{m.group(1)}'  <-- THIS IS THE BUG IF NOT 'Asia/Dubai'")
m = re.search(r'CronTrigger\(hour=settings\.daily_summary_hour', sched_file)
if m:
    print(f"     Daily 9 AM cron   : interpreted in APScheduler's tz")
    if m and 'UTC' in sched_file:
        eff = (s.daily_summary_hour + 4) % 24
        print(f"     -> Your 'hour={s.daily_summary_hour}' fires at {eff:02d}:00 UAE local time, NOT 09:00 UAE")

# 5. Email-discovery hit rate
print()
print("  5. Email discovery hit rate (why the queue is empty)")
disc = db.discovery_tier_counts(days=7)
total = sum(int(r.get("n", 0)) for r in disc)
hits = sum(int(r.get("n", 0)) for r in disc
           if (r.get("decision") or "") in ("hit", "found", "probe_ok"))
rate = (hits / total * 100) if total else 0
print(f"     Last 7 days: {hits} valid recruiter emails out of {total} attempts ({rate:.1f}% hit rate)")
print("     -> Even if the bot runs perfectly, this is the bottleneck.")

# 6. Verdict
print()
print("  6. ROOT CAUSE SUMMARY")
print("  " + "-" * 60)
problems = []
if not alive:
    problems.append("A. SCHEDULER IS DEAD - it must be running for any cycle to fire.")
if s.draft_mode:
    problems.append("B. DRAFT_MODE is ON - even when cycles run, the bot writes\n"
                    "     emails to a review queue instead of sending. You must\n"
                    "     either turn DRAFT_MODE off OR open the queue to click Send.")
if "UTC" in sched_file and "Asia/Dubai" not in sched_file:
    problems.append("C. SCHEDULER TIMEZONE = UTC - your 9 AM cron triggers at\n"
                    "     1 PM UAE, not 9 AM UAE.")
if rate < 10:
    problems.append("D. Email discovery hit rate is " + f"{rate:.0f}% - even when\n"
                    "     the bot runs, most recruiter inboxes can't be found by\n"
                    "     pattern guess. This is a real-world recruiter-mailbox problem.")
if not problems:
    print("     (no problems found - check the dashboard)")
else:
    for p in problems:
        print(f"     {p}")
print()
