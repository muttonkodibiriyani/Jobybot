"""
JobyBots end-to-end smoke test.

Hits every public route on jobybots.com and confirms it loads, returns
the right status code, and contains the expected content marker.

Run any time after a deploy:
    py -3 scripts/e2e_smoke.py
"""
from __future__ import annotations

import sys
import time
from dataclasses import dataclass

import httpx

SITE = "https://jobybots.com"
UA = "JobyBots-E2E/1.0 (+https://jobybots.com)"


@dataclass
class Check:
    label: str
    path: str
    marker: str | None = None
    expect_status: int = 200
    follow_redirects: bool = True


CHECKS: list[Check] = [
    # Public marketing pages
    Check("Home loads",              "/",          marker="JobyBots"),
    Check("Home -- Gemini badge",    "/",          marker="Powered by Google Gemini"),
    Check("Home -- wordmark",        "/",          marker="Joby"),
    Check("Demo page",               "/demo",      marker="AI search"),
    Check("Dashboard preview",       "/dashboard", marker="AI-ranked"),
    Check("Pricing",                 "/pricing",   marker="Jobybot Pro"),
    Check("Buy India",               "/buy-india", marker="UPI"),
    Check("FAQ",                     "/faq",       marker="FAQ"),
    Check("Refund",                  "/refund",    marker="refund"),
    Check("Signup",                  "/signup",    marker="sign", expect_status=200),

    # Static assets / SEO
    Check("Favicon SVG",             "/icon.svg",       marker="<svg"),
    Check("Apple-touch SVG",         "/apple-icon.svg", marker="<svg"),
    Check("robots.txt",              "/robots.txt",     marker="Sitemap"),
    Check("sitemap.xml",             "/sitemap.xml",    marker="urlset"),

    # Admin must be gated
    Check("Admin redirects",         "/admin",   expect_status=200,  # ends at /admin/login (200)
          follow_redirects=True, marker="login"),

    # APIs must reject bad input — we just want them reachable
    Check("Cron API requires auth",  "/api/cron/notify-pending", expect_status=401,
          follow_redirects=False),
]


def main() -> int:
    print()
    print(f"  JobyBots end-to-end smoke test  ->  {SITE}")
    print("  " + "-" * 60)

    passed = 0
    failed: list[str] = []

    with httpx.Client(
        timeout=25.0,
        headers={"User-Agent": UA, "Accept": "*/*"},
        follow_redirects=True,
    ) as cli:
        for c in CHECKS:
            url = f"{SITE}{c.path}"
            try:
                r = cli.get(url, follow_redirects=c.follow_redirects)
                status = r.status_code
                body = r.text
            except Exception as e:
                status = -1
                body = str(e)

            ok = status == c.expect_status
            if ok and c.marker:
                ok = c.marker.lower() in body.lower()

            if ok:
                tag = "PASS"
                passed += 1
            else:
                tag = "FAIL"
                failed.append(f"{c.label} ({c.path}) -- got {status}")

            print(f"  [{tag}] {c.label:<32} {c.path:<30} ({status})")
            if not ok and c.marker:
                print(f"         expected marker: {c.marker!r}")
            time.sleep(0.15)  # be polite

    total = len(CHECKS)
    print("  " + "-" * 60)
    print(f"  Passed: {passed}/{total}    Failed: {len(failed)}")
    if failed:
        print()
        print("  Failures:")
        for f in failed:
            print(f"    - {f}")
        return 1

    print()
    print("  All systems green.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
