"""Run one 15-job cycle of the rebuilt funnel and report the result.

This is the demonstration: now that the funnel marks each attempt,
do_jobs_blast will work through the eligible queue instead of looping
on the same 20 blocked companies forever.
"""
import _root  # noqa: F401
import sqlite3
import time

from core import db
from config import get_settings
from jobybot import do_jobs_blast

db.init_db()
s = get_settings()

print()
print("  ===========================================================")
print(f"  CYCLE — DRAFT_MODE={s.draft_mode}, top_n=15")
print("  ===========================================================")
print("  before:", db.funnel_counts())
print()

t0 = time.time()
total = do_jobs_blast(s, top_n=15)
dt = time.time() - t0

print()
print(f"  → returned {total} in {dt:.1f}s ({dt/15:.1f}s/job avg)")
print()
print("  after:", db.funnel_counts())

print()
print("  Jobs touched this cycle:")
c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row
for r in c.execute("""
    SELECT company, location, match_score, discovery_status,
           discovered_email, pending_email_id
      FROM jobs
     WHERE last_discovery_at >= datetime('now','-10 minutes')
     ORDER BY last_discovery_at DESC
"""):
    mark = "✓" if r["discovered_email"] else "·"
    qid = f"q#{r['pending_email_id']}" if r["pending_email_id"] else ""
    print(f"  {mark} {r['company'][:32]:<32s} {r['location'][:28]:<28s} "
          f"score={r['match_score']:<3d} status={r['discovery_status']:<10s} "
          f"{r['discovered_email'] or ''} {qid}")

print()
print("  NEW pending_emails this cycle:")
for r in c.execute("""
    SELECT id, recipient, company, discovery_tier, discovery_source,
           discovery_confidence, job_id, created_at
      FROM pending_emails
     WHERE created_at >= datetime('now','-10 minutes')
     ORDER BY id DESC
"""):
    print(f"\n  #{r['id']} → {r['recipient']}")
    print(f"    company    : {r['company']}")
    print(f"    job_id     : {r['job_id']}")
    print(f"    tier       : {r['discovery_tier']}  conf={r['discovery_confidence']}")
    print(f"    source     : {(r['discovery_source'] or '')[:80]}")
