"""Evidence dump: what does the bot ACTUALLY know about real recruiter
emails right now? Reads the live database and shows the audit trail
end-to-end.

Sections:
  A  Recently sent emails (proof the send pipeline fires)
  B  Recently QUEUED pending emails with full provenance
  C  Recently DISCOVERED emails by tier (last 24h)
  D  All real recruiter emails the bot has ever found via Gemini
  E  Quick live scrape of one high-yield UAE company
"""
import _root  # noqa: F401
import os
import sqlite3
import time
from datetime import datetime

os.environ["JOBYBOT_SKIP_LOG_FILE"] = "1"

from core import db
from core.email_finder_v2 import find_email_v2

db.init_db()
conn = sqlite3.connect("data/jobybot.db")
conn.row_factory = sqlite3.Row


def H(text):
    print("\n  " + "=" * 78, flush=True)
    print(f"  {text}", flush=True)
    print("  " + "=" * 78, flush=True)


# ---------- A: SENT emails ----------
H("A. EMAILS THE BOT HAS ACTUALLY SENT (most recent 15)")
rows = conn.execute(
    "SELECT sent_at, recipient, company, subject FROM emails_sent "
    "ORDER BY id DESC LIMIT 15"
).fetchall()
if not rows:
    print("  (none yet — bot is in DRAFT_MODE; sends go through review queue)",
          flush=True)
else:
    for r in rows:
        print(f"  {r['sent_at'][:19]}  {r['recipient']:<38s}  "
              f"{(r['company'] or '')[:24]:<24s}  "
              f"{(r['subject'] or '')[:40]}", flush=True)

# ---------- B: PENDING emails awaiting your one-click send ----------
H("B. EMAILS QUEUED FOR YOUR REVIEW (with discovery provenance)")
rows = conn.execute("""
    SELECT id, recipient, company, subject,
           discovery_tier, discovery_source, discovery_confidence,
           recruiter_name, status, created_at
    FROM pending_emails
    WHERE status IN ('queued', 'pending')
    ORDER BY id DESC LIMIT 20
""").fetchall()
if not rows:
    print("  (queue is empty — run `jobybot run` to fill it)", flush=True)
else:
    print(f"  {len(rows)} email(s) awaiting your click in the review queue.",
          flush=True)
    for r in rows:
        print(f"\n    #{r['id']}  → {r['recipient']}", flush=True)
        print(f"      company    : {r['company']}", flush=True)
        print(f"      tier       : {r['discovery_tier'] or '(legacy)'}", flush=True)
        print(f"      confidence : {r['discovery_confidence'] or '—'}", flush=True)
        src = (r["discovery_source"] or "")[:80]
        print(f"      source     : {src or '(not recorded)'}", flush=True)
        print(f"      recruiter  : {r['recruiter_name'] or '—'}", flush=True)
        print(f"      queued     : {r['created_at']}", flush=True)

# ---------- C: discovery log by tier ----------
H("C. DISCOVERY ATTEMPTS BY TIER (last 24 hours)")
rows = conn.execute("""
    SELECT tier, decision, COUNT(*) AS n
    FROM email_discovery_log
    WHERE at >= datetime('now', '-1 day')
    GROUP BY tier, decision ORDER BY tier, n DESC
""").fetchall()
if not rows:
    print("  (no discovery log entries in last 24h)", flush=True)
else:
    for r in rows:
        print(f"  {r['tier']:<18s} {r['decision']:<24s} {r['n']:>4d}",
              flush=True)

# ---------- D: REAL emails Gemini has extracted ever ----------
H("D. REAL RECRUITER EMAILS EXTRACTED VIA GEMINI (t1_ai_extract)")
rows = conn.execute("""
    SELECT at, company, candidate_email, source_url
    FROM email_discovery_log
    WHERE tier='t1_ai_extract' AND decision='found'
    ORDER BY at DESC LIMIT 30
""").fetchall()
if not rows:
    print("  (none yet)", flush=True)
else:
    print(f"  Gemini has extracted {len(rows)} unique-shot recruiter "
          f"contact(s):\n", flush=True)
    for r in rows:
        print(f"  {r['at'][:19]}  {r['candidate_email']:<40s}  "
              f"{r['company'][:24]:<24s}  {(r['source_url'] or '')[:50]}",
              flush=True)

# ---------- E: live scrape NOW, no SMTP gate ----------
H("E. LIVE SCRAPE (no SMTP gate) — show Gemini in action right now")
# These two have publicly-visible recruiter contact info.
test_co = [("Robert Half UAE", "roberthalf.ae"),
           ("Cooper Fitch", "cooperfitch.ae")]
for company, domain in test_co:
    print(f"\n  → {company}", flush=True)
    t0 = time.time()
    try:
        d = find_email_v2(company, market="UAE", enable_smtp_probe=False)
    except Exception as e:
        print(f"    ERROR: {e}", flush=True)
        continue
    dt = time.time() - t0
    if d and d.email:
        print(f"    [HIT]  {d.email}", flush=True)
        print(f"           tier={d.tier} confidence={d.confidence}", flush=True)
        print(f"           src={d.source_url[:80]}", flush=True)
        print(f"           ({dt:.1f}s)", flush=True)
    else:
        print(f"    [miss] ({dt:.1f}s)", flush=True)
