"""Diagnose what DuckDuckGo is actually returning to us."""
import _root  # noqa: F401
import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

print("\n  --- POST to /html/ (current implementation) ---")
r = requests.post(
    "https://html.duckduckgo.com/html/",
    data={"q": "site:talabat.com mailto recruiter"},
    headers={"User-Agent": UA},
    timeout=10,
)
print(f"  status: {r.status_code}")
print(f"  url:    {r.url}")
print(f"  body sample (first 800 chars):")
print("  " + (r.text[:800].replace("\n", "\n  ")) if r.text else "  (empty)")

print("\n\n  --- GET to /html/?q=... (alternative) ---")
r = requests.get(
    "https://html.duckduckgo.com/html/",
    params={"q": "site:talabat.com mailto recruiter"},
    headers={"User-Agent": UA},
    timeout=10,
)
print(f"  status: {r.status_code}")
print(f"  body sample (first 800 chars):")
print("  " + (r.text[:800].replace("\n", "\n  ")) if r.text else "  (empty)")

print("\n\n  --- DDG Lite (text-only fallback) ---")
r = requests.get(
    "https://lite.duckduckgo.com/lite/",
    params={"q": "site:talabat.com mailto recruiter"},
    headers={"User-Agent": UA},
    timeout=10,
)
print(f"  status: {r.status_code}")
print(f"  body sample (first 800 chars):")
print("  " + (r.text[:800].replace("\n", "\n  ")) if r.text else "  (empty)")
