"""Conservative smoke test of LinkedIn Easy Apply.

What this DOES:
  1. Boot Chromium (headful so you can see it)
  2. Inject your li_at cookie
  3. Verify the cookie is still valid (load /feed/, look for navbar)
  4. Run ONE Easy Apply search for your first target title
  5. Count how many Easy Apply jobs are visible
  6. Print + close — DOES NOT click Apply on anything

This is a "dial tone" check: if it prints `LOGIN OK` and a list of
jobs, the full Easy Apply pipeline is wired correctly and the only
remaining question is form-walking quality, which the real cycle
exercises with DRY_RUN=true.
"""
import _root  # noqa: F401
import sys
import time

from config import get_settings
from core import db
from core.easy_apply import _search, _verify_logged_in, _PW_OK

db.init_db()
s = get_settings()

print("\n  EASY APPLY SMOKE TEST", flush=True)
print("  " + "=" * 60, flush=True)
print(f"  playwright importable    : {_PW_OK}", flush=True)
print(f"  enable_easy_apply        : {s.enable_easy_apply}", flush=True)
print(f"  linkedin_cookie set      : {bool((s.linkedin_cookie or '').strip())} ({len((s.linkedin_cookie or '').strip())} chars)", flush=True)
print(f"  dry_run                  : {s.easy_apply_dry_run}", flush=True)
print(f"  headless                 : {s.easy_apply_headless}", flush=True)
print(f"  target_titles            : {s.target_titles}", flush=True)
print(f"  primary_market           : {s.primary_market}", flush=True)

if not _PW_OK:
    print("\n  ABORT: playwright not importable.", flush=True)
    sys.exit(1)

from playwright.sync_api import sync_playwright

cookie = (s.linkedin_cookie or "").strip()
if not cookie:
    print("\n  ABORT: LINKEDIN_COOKIE not set.", flush=True)
    sys.exit(1)

titles = [t.strip() for t in s.target_titles.split(",") if t.strip()]
title = titles[0] if titles else "Product Manager"
location = "Dubai, United Arab Emirates"
print(f"\n  Search target: '{title}' in '{location}'", flush=True)

with sync_playwright() as pw:
    print("  · launching chromium...", flush=True)
    browser = pw.chromium.launch(headless=bool(s.easy_apply_headless))
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    )
    context.add_cookies([{
        "name":   "li_at",
        "value":  cookie,
        "domain": ".linkedin.com",
        "path":   "/",
        "secure": True,
        "httpOnly": True,
        "sameSite": "None",
    }])
    page = context.new_page()

    print("  · verifying login...", flush=True)
    t0 = time.time()
    logged_in = _verify_logged_in(page)
    print(f"    {'LOGIN OK' if logged_in else 'LOGIN FAILED'} ({time.time()-t0:.1f}s)", flush=True)
    if not logged_in:
        print("\n  Refresh your li_at cookie via login on LinkedIn in a normal browser,", flush=True)
        print("  then export the cookie value and put it in .env as LINKEDIN_COOKIE=...", flush=True)
        browser.close()
        sys.exit(2)

    print(f"  · searching for Easy Apply jobs...", flush=True)
    t0 = time.time()
    try:
        cards = _search(
            page,
            title=title,
            location=location,
            date_posted=s.easy_apply_filter_date_posted,
            exp_levels=s.easy_apply_exp_levels,
        )
    except Exception as e:
        print(f"    SEARCH FAILED: {e}", flush=True)
        browser.close()
        sys.exit(3)
    print(f"    {len(cards)} Easy Apply job cards found ({time.time()-t0:.1f}s)", flush=True)

    print("\n  Sample (first 5):", flush=True)
    for c in cards[:5]:
        print(f"    + {c.title[:45]:<45s} @ {c.company[:25]:<25s} - {c.location[:25]}", flush=True)
        print(f"      {c.url[:90]}", flush=True)

    print("\n  Smoke test complete — NOT clicking Apply (this is a dial-tone check).", flush=True)
    browser.close()

print("\n  RESULT: Easy Apply pipeline is wired correctly.", flush=True)
print("  Next step: `jobybot easy-apply` runs the full DRY_RUN cycle with the daily cap.", flush=True)
