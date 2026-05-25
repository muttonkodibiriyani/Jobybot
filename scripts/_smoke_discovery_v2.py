"""Smoke test the rebuilt discovery waterfall: T1 -> T1.5 (AI) -> T2 -> T3-disabled."""
import _root  # noqa: F401
from core import db
from core.email_finder_v2 import find_email_v2

db.init_db()

cases = [
    # Real companies with public careers/contact pages
    ("Talabat",           "UAE",       ""),
    ("Careem",            "UAE",       ""),
    ("Emirates NBD",      "UAE",       ""),
    ("Aldar Properties",  "UAE",       ""),
    ("Chalhoub Group",    "UAE",       ""),
    ("Stripe",            "Singapore", ""),
    ("Atlassian",         "Australia", ""),
    ("Canva",             "Australia", ""),
]

print("\n  DISCOVERY V2 SMOKE TEST (T1 careers + T1.5 AI + T2 LinkedIn)")
print("  " + "=" * 65)
for company, country, job_url in cases:
    d = find_email_v2(company, market=country, job_url=job_url)
    if d.email:
        print(f"  + {company:<22s} [{country:<10s}] {d.tier:<16s} {d.email}")
        if d.first_name:
            print(f"      recruiter: {d.first_name}")
        if d.source_url:
            print(f"      source:    {d.source_url[:70]}")
    else:
        print(f"  - {company:<22s} [{country:<10s}] no_real_email_found")
print()
