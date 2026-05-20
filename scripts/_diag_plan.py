"""Preview the per-market blast plan WITHOUT sending any emails."""
import sys
sys.path.insert(0, ".")
import json
from pathlib import Path
from config import get_settings
from core import db

settings = get_settings()
db.init_db()

print("Per-market plan preview — this is what the new code logs each cycle:")
print()

total_fresh = 0
total_already = 0
total_skip = 0

for country in settings.all_markets:
    fname = "primary_uae.json" if country.upper() == "UAE" else f"secondary_{country.lower()}.json"
    fpath = Path("markets") / fname
    if not fpath.exists():
        print(f"  [{country:<14}] no market file")
        continue
    m = json.loads(fpath.read_text(encoding="utf-8"))
    contacts = m.get("contacts", [])
    if m.get("gdpr_strict") or m.get("apply_via_website_only"):
        print(f"  [{country:<14}] {len(contacts):>3} contacts  →  GDPR-strict, will skip cold email")
        total_skip += len(contacts)
        continue
    fresh = sum(1 for c in contacts if not db.already_emailed(c["email"], 0))
    already = len(contacts) - fresh
    total_fresh += fresh
    total_already += already
    print(f"  [{country:<14}] {len(contacts):>3} contacts  →  {fresh:>3} fresh to send, {already:>3} already emailed")

print()
print(f"GRAND PLAN: {total_fresh} fresh sends, {total_already} skipped (already emailed), {total_skip} GDPR-skipped")
print()
print("Behaviour change: the bot will FLY through 'already emailed' contacts now —")
print("no 30-120s sleep per skipped contact. Old code wasted ~40 min doing nothing on UAE.")
