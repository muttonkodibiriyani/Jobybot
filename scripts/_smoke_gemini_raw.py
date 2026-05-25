"""Bypass our extractor — call Gemini directly on a known-rich page."""
import _root  # noqa: F401
import sys
import time

import requests

import os
from config import get_settings

s = get_settings()
key = os.environ.get("GEMINI_API_KEY") or s.gemini_api_key
print(f"  Gemini key: {'set ('+str(len(key))+' chars)' if key else 'MISSING'}", flush=True)
if not key:
    sys.exit(1)

# Hand-crafted page with multiple emails so we can validate Gemini filters correctly.
text = (
    "Welcome to Acme Corp careers. "
    "If you want to apply for a role, please contact our talent "
    "acquisition lead Priya Sharma at priya.sharma@acmecorp.com. "
    "For general enquiries: hello@acmecorp.com. "
    "Press: press@acmecorp.com. "
    "Investor relations: ir@acmecorp.com. "
    "Our CEO John Doe (john@acmecorp.com) is also available. "
    "Personal contact for collaboration: priya85@gmail.com. "
)
print(f"  test page text ({len(text)} chars):\n  {text}", flush=True)

# Now call Gemini
print("\n  calling Gemini Flash...", flush=True)
import google.generativeai as genai
genai.configure(api_key=key)

m = genai.GenerativeModel(
    "gemini-flash-latest",
    system_instruction=(
        "Extract recruiter / HR / talent contacts from this web page text. "
        "Return JSON array: [{\"name\":..., \"title\":..., \"email\":..., "
        "\"source_snippet\":...}]. ONLY use emails literally present in the text. "
        "If none, return []."
    ),
    generation_config={"response_mime_type": "application/json"},
)
t0 = time.time()
resp = m.generate_content(text)
print(f"\n  Gemini responded in {time.time()-t0:.1f}s:", flush=True)
print(f"  raw output:", flush=True)
print(f"  {(resp.text or '').strip()[:1500]}", flush=True)
