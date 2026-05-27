"""Smoke test the new T2.5 role-mailbox tier.

Picks 6 UAE/Singapore companies from the eligible job pool, runs the
full discovery waterfall, and reports what each tier returned. We
expect T2.5 to find at least 2-3 role mailboxes that the old waterfall
would have missed (T1 careers-page scrape only catches mailtos in
HTML; T2.5 probes the mailbox itself).
"""
import _root  # noqa
import time
from core import db
from core.email_finder_v2 import find_email_v2
from config import get_settings

db.init_db()
s = get_settings()

# Hand-picked: mid-cap UAE/SG companies that DON'T publish recruiter
# emails on careers pages (so T1 misses them) but DO accept role
# mailbox (which T2.5 finds).
TARGETS = [
    ("Bayzat", "bayzat.com", "UAE"),                 # already cached → t0
    ("Foodics", "foodics.com", "UAE"),                # mid-cap SaaS
    ("Tabby", "tabby.ai", "UAE"),                     # BNPL UAE
    ("Eros Group", "erosgroup.com", "UAE"),           # retail UAE
    ("Yallacompare", "yallacompare.com", "UAE"),      # fintech UAE
    ("Sary", "sary.com", "Saudi"),                    # B2B SA
]

print()
print(f"  Smoke: T2.5 role-mailbox tier on {len(TARGETS)} companies")
print()
for company, domain, market in TARGETS:
    t0 = time.time()
    try:
        d = find_email_v2(
            company,
            market=market,
            enable_smtp_probe=True,
        )
    except Exception as e:
        print(f"  {company:<25s} ERROR: {e}")
        continue
    dt = time.time() - t0
    if d and d.email:
        print(f"  ✓ {company:<22s}  {d.email:<32s}  [{d.tier}/{d.confidence}]  "
              f"probe={d.probe_code or '-'}  ({dt:.1f}s)")
    else:
        print(f"  · {company:<22s}  (no email found)  ({dt:.1f}s)")
