"""End-to-end proof: scrape a real recruiter email with Gemini, queue it
for review, and print the audit trail.

This is the demo we run when a customer asks "show me it actually works".
It exercises:
  T1 careers-page expanded paths
  T1.5 ai_extract (Gemini Flash)
  T2 LinkedIn cookie path (skipped here because no job_url)
  Discovery log write
  pending_emails queue insert with full provenance
"""
import _root  # noqa: F401
import sqlite3
import sys
import time

from core import db
from core.email_finder_v2 import find_email_v2
from core.email_sender import send_application
from core.cover_letter import render as render_letter
from config import get_settings

db.init_db()
s = get_settings()


def banner(text):
    print("\n  " + "=" * 70, flush=True)
    print(f"  {text}", flush=True)
    print("  " + "=" * 70, flush=True)


# Use a REAL UAE-based recruiter agency that publicly publishes
# recruiter email addresses on its contact page.
# (Recruiter agencies are the canonical test case because they MUST
# publish contact emails — recruiting is their business.)
companies = [
    ("Cooper Fitch",       "cooperfitch.ae"),   # UAE recruiter
    ("Charterhouse",       "charterhouseme.ae"),
    ("Hays Middle East",   "hays.ae"),
    ("Kingston Stanley",   "kingstonstanley.com"),
    ("Mark Williams",      "mwa-int.com"),
]

banner("STEP 1: BEFORE — show the discovery log is currently quiet")
c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row
before_count = c.execute(
    "SELECT COUNT(*) AS n FROM email_discovery_log "
    "WHERE tier='t1_ai_extract' AND at >= datetime('now', '-1 hour')"
).fetchone()["n"]
print(f"  AI-extract entries logged in the last hour: {before_count}", flush=True)

banner("STEP 2: RUN GEMINI EXTRACTION ON REAL UAE COMPANIES")
found = []
for company, domain in companies:
    print(f"\n  → {company} ({domain})", flush=True)
    t0 = time.time()
    try:
        d = find_email_v2(company, market="UAE", enable_smtp_probe=True)
    except Exception as e:
        print(f"    ERROR: {e}", flush=True)
        continue
    dt = time.time() - t0
    if d and d.email:
        print(f"    FOUND : {d.email}", flush=True)
        print(f"    TIER  : {d.tier}", flush=True)
        print(f"    CONF  : {d.confidence}", flush=True)
        print(f"    NAME  : {d.first_name or '(not extracted)'}", flush=True)
        print(f"    SRC   : {d.source_url[:90]}", flush=True)
        print(f"    ({dt:.1f}s)", flush=True)
        found.append((company, d))
    else:
        print(f"    no email found ({dt:.1f}s)", flush=True)
    if len(found) >= 3:
        break  # 3 hits is enough to prove the point

banner("STEP 3: AFTER — the discovery log captured every attempt")
rows = c.execute(
    "SELECT at, tier, decision, candidate_email, company, source_url "
    "FROM email_discovery_log "
    "WHERE at >= datetime('now', '-5 minutes') "
    "ORDER BY at DESC LIMIT 20"
).fetchall()
for r in rows:
    src = (r["source_url"] or "")[:50]
    cand = (r["candidate_email"] or "—")[:30]
    print(f"  {r['at'][:19]}  {r['tier']:<16s} {r['decision']:<22s} "
          f"{cand:<30s} {r['company'][:18]:<18s} {src}", flush=True)

banner("STEP 4: QUEUE ONE INTO pending_emails WITH FULL PROVENANCE")
if not found:
    print("  No real emails discovered in this run — see step 3 for why "
          "(most companies don't publish recruiter emails on /careers).",
          flush=True)
    sys.exit(0)

company, d = found[0]
profile = {
    "name":      s.user_name,
    "email":     s.user_email,
    "phone":     s.user_phone,
    "linkedin":  s.user_linkedin,
    "location":  s.user_location,
    "visa":      s.user_visa,
    "notice":    s.user_notice,
    "summary":   s.user_summary,
    "titles":    [t.strip() for t in s.target_titles.split(",")],
    "skills":    [],
}

# Drive the full send pipeline. DRAFT_MODE=true means it queues
# instead of sending — exactly what we want for the demo.
ok = send_application(
    s,
    recipient=d.email,
    company=company,
    category="Employer",
    profile=profile,
    job_title="Senior Product Manager",
    job_description="(demo proof — exercises the queue + provenance path)",
    discovery_tier=d.tier,
    discovery_source=d.source_url,
    discovery_confidence=d.confidence,
    recruiter_first_name=d.first_name or "",
)
print(f"\n  send_application returned: {ok}", flush=True)
print(f"  (with DRAFT_MODE={s.draft_mode}, this queues for review)", flush=True)

banner("STEP 5: PROOF — fetch the pending_emails row we just queued")
rows = c.execute(
    "SELECT id, recipient, company, subject, "
    "discovery_tier, discovery_source, discovery_confidence, "
    "recruiter_name, created_at "
    "FROM pending_emails "
    "WHERE created_at >= datetime('now', '-2 minutes') "
    "ORDER BY id DESC LIMIT 5"
).fetchall()
for r in rows:
    print(f"\n  queue id #{r['id']}", flush=True)
    print(f"    recipient            : {r['recipient']}", flush=True)
    print(f"    company              : {r['company']}", flush=True)
    print(f"    subject              : {r['subject']}", flush=True)
    print(f"    discovery_tier       : {r['discovery_tier']}", flush=True)
    print(f"    discovery_confidence : {r['discovery_confidence']}", flush=True)
    print(f"    discovery_source     : {r['discovery_source']}", flush=True)
    print(f"    recruiter_name       : {r['recruiter_name'] or '(not set)'}", flush=True)
    print(f"    created_at           : {r['created_at']}", flush=True)

banner("STEP 6: REVIEW QUEUE")
print("  Open this URL to see the queued email with the same provenance"
      " in the UI:", flush=True)
print("    http://127.0.0.1:7868", flush=True)
print("  (run `jobybot queue` if the server isn't already running)", flush=True)
