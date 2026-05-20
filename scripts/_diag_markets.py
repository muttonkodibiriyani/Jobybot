"""List market files + contact counts + GDPR flags."""
import json
from pathlib import Path

print(f"{'file':40s} {'contacts':>10s}  {'gdpr_strict':>12s}")
print("-" * 70)
for m in sorted(Path("markets").glob("*.json")):
    data = json.loads(m.read_text(encoding="utf-8"))
    contacts = data.get("contacts", [])
    gdpr = bool(data.get("gdpr_strict") or data.get("apply_via_website_only"))
    print(f"{m.name:40s} {len(contacts):>10d}  {str(gdpr):>12s}")
