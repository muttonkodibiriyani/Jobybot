"""End-to-end smoke: run jobs_blast on a small batch and report.

Proves that the new T2.5 + queue-drain pipeline really produces
NEW outreach in the customer's words: "20 NEW emails per day".
"""
import _root  # noqa
import time
from core import db
from config import get_settings
import jobybot as jb

db.init_db()
s = get_settings()

print()
print("=" * 60)
print("  SMOKE: discover + queue 15 jobs end-to-end")
print("=" * 60)

before_pending = db.pending_queue_stats()
before_sent = db.emails_sent_today()
print(f"  BEFORE: pending_queue={before_pending['pending']}, "
      f"sent_today={before_sent}")

t0 = time.time()
result = jb.do_jobs_blast(s, top_n=15)
dt = time.time() - t0

after_pending = db.pending_queue_stats()
after_sent = db.emails_sent_today()

print()
print(f"  AFTER : pending_queue={after_pending['pending']}, "
      f"sent_today={after_sent}")
print(f"  Net change: +{after_pending['pending'] - before_pending['pending']} "
      f"queued, +{after_sent - before_sent} sent")
print(f"  do_jobs_blast returned: {result}")
print(f"  Time taken: {dt:.0f}s for 15 jobs ({dt/15:.1f}s/job avg)")

print()
print("  New pending emails (last 5):")
import sqlite3
c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row
for r in c.execute(
    """SELECT recipient, company, discovery_tier, discovery_confidence,
              job_title, created_at
         FROM pending_emails
        WHERE status='pending'
        ORDER BY id DESC LIMIT 5"""
):
    print(f"    {r['created_at'][:19]}  "
          f"{r['recipient'][:32]:<32s}  "
          f"{(r['company'] or '')[:18]:<18s}  "
          f"[{r['discovery_tier']}/{r['discovery_confidence']}]")
