"""Compress extension/apply_helper.js into a one-line javascript: bookmarklet."""
from pathlib import Path
from urllib.parse import quote
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

src = Path("extension") / "apply_helper.js"
out = Path("data") / "bookmarklet.txt"

if not src.exists():
    print("apply_helper.js not found")
    raise SystemExit(1)

js = src.read_text(encoding="utf-8")
# Wrap as a single-call IIFE-aware bookmarklet
url = "javascript:" + quote(js, safe="!*'();:@&=+$,/?#[]")

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(url, encoding="utf-8")

print(f"Wrote {out.resolve()} ({len(url):,} chars)")
print("Paste the contents as the URL of a new browser bookmark.")
