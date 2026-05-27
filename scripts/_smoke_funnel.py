"""Smoke test the rebuilt funnel.

Runs ONE do_jobs_blast with top_n=5 and prints the before/after
funnel counts plus what landed in pending_emails. This is the dial
tone test for the funnel fix — if jobs go from 'pending' to either
'queued' or 'no_email', the loop is no longer stuck.
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
print("  BEFORE: funnel state")
print("  ===========================================================")
for k, v in db.funnel_counts().items():
    print(f"    {k:<22s}  {v}")

print()
print("  ===========================================================")
print(f"  RUNNING do_jobs_blast(top_n=5)  DRAFT_MODE={s.draft_mode}")
print("  ===========================================================")
t0 = time.time()
total = do_jobs_blast(s, top_n=5)
dt = time.time() - t0
print(f"  → returned {total} in {dt:.1f}s")

print()
print("  ===========================================================")
print("  AFTER: funnel state")
print("  ===========================================================")
for k, v in db.funnel_counts().items():
    print(f"    {k:<22s}  {v}")

print()
print("  ===========================================================")
print("  What landed in pending_emails just now")
print("  ===========================================================")
c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row
rows = c.execute("""
    SELECT id, recipient, company, subject,
           discovery_tier, discovery_source, discovery_confidence,
           job_id, status, created_at
      FROM pending_emails
     WHERE created_at >= datetime('now','-5 minutes')
     ORDER BY id DESC
""").fetchall()
print(f"  {len(rows)} new pending row(s) this run:")
for r in rows:
    print(f"\n  #{r['id']} → {r['recipient']}")
    print(f"    company    : {r['company']}")
    print(f"    job_id     : {r['job_id']}  (now linked!)")
    print(f"    tier       : {r['discovery_tier']}")
    print(f"    confidence : {r['discovery_confidence']}")
    print(f"    source     : {(r['discovery_source'] or '')[:80]}")

print()
print("  ===========================================================")
print("  Job rows the cycle just touched")
print("  ===========================================================")
rows = c.execute("""
    SELECT id, company, location, match_score,
           discovery_attempts, last_discovery_at, discovery_status,
           discovered_email, pending_email_id
      FROM jobs
     WHERE last_discovery_at >= datetime('now','-5 minutes')
     ORDER BY last_discovery_at DESC LIMIT 20
""").fetchall()
for r in rows:
    flag = "✓" if r["discovered_email"] else "·"
    print(f"  {flag} {r['company'][:32]:<32s} {r['location'][:24]:<24s} "
          f"attempts={r['discovery_attempts']} status={r['discovery_status']:<10s} "
          f"email={r['discovered_email'] or '(none)'} pending={r['pending_email_id']}")
