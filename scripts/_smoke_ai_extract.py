"""Direct test of the AI-extract tier on one company. Prints progress live."""
import _root  # noqa: F401
import sys
import time

from core import db
from core.finders import ai_extract

db.init_db()

# Try a UAE company with a public careers page known to mention email contacts.
company = "Talabat"
domain = "talabat.com"
urls = [
    f"https://corporate.{domain}/careers",
    f"https://corporate.{domain}/about/contact",
    f"https://{domain}/careers",
    f"https://{domain}/contact",
]

print(f"\n  AI EXTRACT smoke test: {company} ({domain})", flush=True)
print("  " + "=" * 60, flush=True)

for url in urls:
    print(f"\n  --> fetching {url}", flush=True)
    t0 = time.time()
    contacts = ai_extract.extract_from_url(
        url, company=company, company_domain=domain,
    )
    dt = time.time() - t0
    if contacts:
        for c in contacts:
            print(f"      + {c.name!r:<25s} {c.title!r:<25s} {c.email}", flush=True)
            print(f"        ctx: {c.source_snippet[:90]!r}", flush=True)
        print(f"      ({dt:.1f}s)", flush=True)
        sys.exit(0)
    else:
        print(f"      (no contacts found, {dt:.1f}s)", flush=True)

print("\n  none of the URLs yielded a contact.", flush=True)
