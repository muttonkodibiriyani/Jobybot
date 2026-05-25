"""Smoke-test the new T1.5 DuckDuckGo recruiter-email finder."""
import _root  # noqa: F401
from core import db
from core.finders import web_search

db.init_db()

cases = [
    # (company, domain_hint, country)
    ("Talabat",         "talabat.com",       "UAE"),
    ("Careem",          "careem.com",        "UAE"),
    ("Emirates NBD",    "emiratesnbd.com",   "UAE"),
    ("Aldar Properties","aldar.com",         "UAE"),
    ("ADCB",            "adcb.com",          "UAE"),
    ("Canva",           "canva.com",         "Australia"),
    ("Stripe",          "stripe.com",        "Singapore"),
]

print("\n  T1.5 web-search smoke test")
print("  " + "=" * 60)
for company, domain, country in cases:
    print(f"\n  > {company} ({domain} / {country})")
    pairs = web_search.discover(
        company, company_domain=domain, country=country
    )
    if not pairs:
        print("    no candidates from DDG search")
    else:
        for addr, src in pairs:
            print(f"    candidate: {addr:<40s}  from: {src[:70]}")
