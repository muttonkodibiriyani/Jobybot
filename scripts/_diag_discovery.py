"""Show exactly which discovery tier is doing the heavy lifting + what's broken."""
import _root  # noqa: F401
import sqlite3

c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row

print("\n  DISCOVERY TIER REPORT (last 7 days)\n" + "  " + "=" * 60)
rows = c.execute("""
  SELECT tier, decision, COUNT(*) AS n
  FROM email_discovery_log
  WHERE at >= datetime('now', '-7 days')
  GROUP BY tier, decision
  ORDER BY tier, n DESC
""").fetchall()
last_tier = None
for r in rows:
    if r["tier"] != last_tier:
        print(f"\n  {r['tier']}")
        last_tier = r["tier"]
    print(f"    {r['decision']:<32s} {r['n']:>4d}")

print("\n  REAL emails actually found (any tier that returned a usable address):")
rows = c.execute("""
  SELECT tier, candidate_email, company, source_url, at
  FROM email_discovery_log
  WHERE decision IN ('found','hit','probe_ok')
  ORDER BY at DESC LIMIT 15
""").fetchall()
if not rows:
    print("    (none found in the last 7 days)")
for r in rows:
    print(f"    [{r['tier']:<14s}] {r['candidate_email']:<35s} <- {r['company'][:30]:<30s} {(r['source_url'] or '')[:50]}")

print("\n  LinkedIn lookups today:")
n = c.execute("SELECT COUNT(*) AS n FROM linkedin_lookups WHERE at >= date('now')").fetchone()["n"]
print(f"    {n} lookups (cap is 30/day in linkedin_login.py)")

print("\n  Cookie health (do we have a working LINKEDIN_COOKIE?):")
import os
ck = os.environ.get("LINKEDIN_COOKIE") or ""
ck_path = "data/linkedin_cookies.json"
import json
from pathlib import Path
if ck:
    print(f"    LINKEDIN_COOKIE env var: SET ({len(ck)} chars)")
elif Path(ck_path).exists():
    try:
        d = json.loads(Path(ck_path).read_text(encoding="utf-8"))
        li = None
        if isinstance(d, list):
            for c2 in d:
                if c2.get("name") == "li_at":
                    li = c2.get("value", "")
        elif isinstance(d, dict):
            li = d.get("li_at") or (d.get("cookies") or {}).get("li_at")
        if li:
            print(f"    {ck_path}: li_at present ({len(li)} chars)")
        else:
            print(f"    {ck_path}: EXISTS but li_at not found")
    except Exception as e:
        print(f"    {ck_path}: parse error: {e}")
else:
    print(f"    NOT SET. LinkedIn finder (T2) cannot run.")
print()
