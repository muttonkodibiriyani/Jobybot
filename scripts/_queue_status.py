"""Show the manual-review queue + draft_mode state."""
import _root  # noqa: F401
from core import db
from config import get_settings

db.init_db()
s = get_settings()
print(f"draft_mode = {s.draft_mode}  (True = emails go to review queue, not auto-sent)")
print(f"daily_email_cap = {s.daily_email_cap}  (per Gmail limits — bot stops at this)")
print()

stats = db.pending_queue_stats()
print("--- Review queue counters ---")
for k, v in stats.items():
    print(f"  {k:<10s} = {v}")
print()

rows = db.list_pending_emails(limit=10)
print(f"--- Top {len(rows)} pending emails (awaiting your review) ---")
for r in rows:
    subj = (r["subject"] or "")[:60]
    print(f"  #{r['id']:<4d} {r['recipient']:<35s}  {r['company'][:18]:<18s}  {subj}")
