"""End-to-end deliverability test (NO SENDS).

Runs find_email_v2 against a handful of real UAE / GCC / India companies
to prove the new 5-tier waterfall + SMTP probe is wired up. Logs every
attempt to email_discovery_log so we can see tier hit rates in the
dashboard.

Run from project root with the venv Python.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Force unicode-safe stdout on Windows consoles
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from core import db  # noqa: E402
from core.email_finder_v2 import find_email_v2  # noqa: E402
from config import get_settings  # noqa: E402


# (company, market, job_url)  - job_url is optional, set when we have one
TARGETS = [
    ("Talabat", "UAE", "https://careers.talabat.com/"),
    ("Noon", "UAE", "https://careers.noon.com/"),
    ("Careem", "UAE", "https://careem.com/careers"),
    ("Property Finder", "UAE", "https://careers.propertyfinder.com/"),
    ("Mashreq", "UAE", "https://www.mashreqbank.com/uae/en/careers"),
    ("Foodics", "Saudi", "https://careers.foodics.com/"),
    ("Tabby", "Saudi", "https://tabby.ai/careers"),
    ("Tamara", "Saudi", "https://tamara.co/en/careers"),
    ("Snoonu", "Qatar", "https://snoonu.com/careers"),
    ("Bayan Pay", "Qatar", "https://bayanpay.qa/careers"),
]


def main() -> int:
    db.init_db()
    settings = get_settings()
    cookie = getattr(settings, "linkedin_cookie", "") or ""
    if cookie:
        print(f"LinkedIn cookie present: {len(cookie)} chars (Tier-2 active)")
    else:
        print("LinkedIn cookie EMPTY - Tier-2 will be skipped")

    print(f"\nRunning discovery on {len(TARGETS)} real companies...")
    print(f"EMAIL_FINDER_TIER={settings.email_finder_tier}  "
          f"SMTP_PROBE_ENABLED={settings.smtp_probe_enabled}")
    print("-" * 90)

    results = []
    for company, market, job_url in TARGETS:
        t0 = time.time()
        try:
            disc = find_email_v2(
                company,
                job_url=job_url,
                market=market,
                linkedin_cookie=cookie,
                enable_smtp_probe=settings.smtp_probe_enabled,
            )
        except Exception as e:
            disc = None
            err = str(e)
        else:
            err = ""
        latency = int((time.time() - t0) * 1000)

        if disc and getattr(disc, "email", None):
            email = disc.email
            tier = getattr(disc, "tier", "?")
            probe = getattr(disc, "probe_code", "") or "-"
            recruiter = getattr(disc, "first_name", "") or "-"
            conf = getattr(disc, "confidence", "low")
            status = (f"OK   tier={tier:14s} conf={conf:6s} probe={probe:4s}  "
                      f"{email}  (recruiter first name: {recruiter})")
        elif err:
            status = f"ERR  {err[:80]}"
        else:
            status = "MISS  no email found across tiers"

        print(f"  {company:18s} {market:7s} {latency:5d}ms  {status}")
        results.append((company, market, disc, err, latency))

    print("-" * 90)
    found = sum(1 for r in results if r[2] and getattr(r[2], "email", None))
    print(f"\nSummary: {found}/{len(TARGETS)} companies returned a deliverable email")

    print("\nTier hit counts (last 7 days):")
    for row in db.discovery_tier_counts(days=7):
        print(f"  tier={row['tier']:14s} decision={row['decision']:8s} n={row['n']}")

    print("\nMost recent 10 discovery log rows:")
    for row in db.recent_discovery(10):
        print(f"  {row['at']}  {row['company']:18s} tier={row['tier']:14s} "
              f"decision={row['decision']:8s} probe={row.get('probe_code', '-') or '-':4s} "
              f"email={row.get('candidate_email') or '-'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
