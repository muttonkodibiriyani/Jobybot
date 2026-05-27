"""Live demo: discover real recruiter emails for 8 NEW UAE companies that
haven't been emailed today, queue them with full provenance, then print
the queue so you can see exactly what would appear in the review UI.

Uses the production code path:
    find_email_v2  →  send_application (DRAFT_MODE=true)  →  pending_emails

That means: same path the bot uses in production, no shortcuts.
"""
import _root  # noqa: F401
import sqlite3
import sys
import time

from core import db
from core.email_finder_v2 import find_email_v2
from core.email_sender import send_application
from config import get_settings

db.init_db()
s = get_settings()

# UAE companies with publicly-discoverable recruiter contacts. These are
# real targets the bot might surface during a normal cycle. We use jobs
# from sectors the user targets (Product Management, Data, AI).
TARGETS = [
    ("Nine2Five UAE",     "nine2five.ae",       "Product Manager"),
    ("BAC Middle East",   "bacme.com",          "Senior Product Manager"),
    ("Antal International", "antal.ae",         "Product Manager"),
    ("MENA Recruit",      "menarecruit.com",    "Data Product Manager"),
    ("Robbert Murray",    "robbertmurray.com",  "Product Manager"),
    ("Mindfield",         "mindfieldresources.com", "Product Manager"),
    ("Macdonald & Co",    "macdonaldandcompany.com", "Real Estate Product Manager"),
    ("Reach Group",       "reachgroup.com",     "Senior Product Manager"),
]

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

print("\n  ====================================================================")
print(f"  LIVE DEMO — 8 UAE companies, DRAFT_MODE={s.draft_mode}")
print("  ====================================================================")
print(f"  pending_emails BEFORE run:", flush=True)
conn = sqlite3.connect("data/jobybot.db")
conn.row_factory = sqlite3.Row
before = conn.execute("SELECT COUNT(*) AS n FROM pending_emails").fetchone()["n"]
print(f"    {before} row(s)\n", flush=True)

queued = []
for company, domain, title in TARGETS:
    print(f"  → {company} ({domain})", flush=True)
    t0 = time.time()
    try:
        d = find_email_v2(company, market="UAE", enable_smtp_probe=True)
    except Exception as e:
        print(f"    ERROR: {e}\n", flush=True)
        continue
    dt = time.time() - t0
    if not d or not d.email:
        print(f"    no deliverable email found ({dt:.1f}s)\n", flush=True)
        continue
    print(f"    [FOUND] {d.email}  tier={d.tier}  conf={d.confidence}", flush=True)
    print(f"            src={d.source_url[:75]}  ({dt:.1f}s)", flush=True)
    ok = send_application(
        s,
        recipient=d.email,
        company=company,
        category="Employer",
        profile=profile,
        job_title=title,
        job_description=f"(live demo proof — {company} {title})",
        discovery_tier=d.tier,
        discovery_source=d.source_url,
        discovery_confidence=d.confidence,
        recruiter_first_name=d.first_name or "",
    )
    if ok:
        queued.append((company, d.email, d.tier))
        print(f"            [QUEUED for review]\n", flush=True)
    else:
        print(f"            [skipped — likely dedup / blocklist]\n", flush=True)

after = conn.execute("SELECT COUNT(*) AS n FROM pending_emails").fetchone()["n"]
print(f"  pending_emails AFTER run:  {after} row(s)  (+{after-before})\n", flush=True)

print("  ====================================================================")
print(f"  QUEUED THIS RUN ({len(queued)} item(s))")
print("  ====================================================================")
for co, email, tier in queued:
    print(f"    + {co:<28s}  {email:<38s}  [{tier}]")

print()
print("  ====================================================================")
print("  ENTIRE CURRENT QUEUE WITH PROVENANCE")
print("  ====================================================================")
rows = conn.execute("""
    SELECT id, recipient, company, subject,
           discovery_tier, discovery_source, discovery_confidence,
           recruiter_name, status, created_at
    FROM pending_emails
    WHERE status IN ('queued','pending') OR status IS NULL
    ORDER BY id DESC LIMIT 20
""").fetchall()
for r in rows:
    print(f"\n  #{r['id']} → {r['recipient']}")
    print(f"    company    : {r['company']}")
    print(f"    subject    : {r['subject']}")
    print(f"    tier       : {r['discovery_tier'] or '(legacy)'}")
    print(f"    confidence : {r['discovery_confidence'] or '—'}")
    print(f"    source     : {(r['discovery_source'] or '')[:80]}")
    print(f"    recruiter  : {r['recruiter_name'] or '—'}")
    print(f"    queued     : {r['created_at']}  status={r['status']}")
