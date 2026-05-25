"""Diagnose what LinkedIn is actually returning to us with the cookie."""
import _root  # noqa: F401
import sys

from config import get_settings

s = get_settings()
cookie = (s.linkedin_cookie or "").strip()
print(f"\n  cookie length: {len(cookie)} chars")
print(f"  cookie starts: {cookie[:30]}...")

from playwright.sync_api import sync_playwright

print("\n  Booting Chromium (headful) with cookie...", flush=True)
with sync_playwright() as pw:
    context = pw.chromium.launch_persistent_context(
        user_data_dir="data/browser_profiles/linkedin_diag",
        headless=False,
        args=["--disable-blink-features=AutomationControlled"],
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1440, "height": 900},
    )
    context.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
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
    for target in (
        "https://www.linkedin.com/jobs/",
        "https://www.linkedin.com/feed/",
    ):
        print(f"\n  -> {target}", flush=True)
        try:
            r = page.goto(target, wait_until="domcontentloaded", timeout=20_000)
            print(f"     landed: {page.url}", flush=True)
            print(f"     status: {r.status if r else 'none'}", flush=True)
            title = page.title()
            print(f"     title : {title[:80]}", flush=True)
        except Exception as e:
            print(f"     ERROR: {e}", flush=True)

    # Take a screenshot so the user can see exactly what state we landed in
    try:
        page.screenshot(path="data/li_diag.png", full_page=False)
        print("\n  Screenshot: data/li_diag.png", flush=True)
    except Exception as e:
        print(f"\n  screenshot failed: {e}", flush=True)

    print("\n  Browser will stay open 15 seconds so you can see it...", flush=True)
    import time
    time.sleep(15)
    context.close()
