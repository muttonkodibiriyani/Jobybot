"""Confirm followups_due() returns the 405 contacts now that FOLLOWUP_DAYS=3."""
import _root  # noqa: F401
from core import db
from config import get_settings

db.init_db()
s = get_settings()

due = db.followups_due()
print(f"\n  Settings: FOLLOWUP_DAYS = {s.followup_days}")
print(f"  Settings: DRAFT_MODE    = {s.draft_mode}")
print(f"  Settings: DAILY_CAP     = {s.daily_email_cap}")
print(f"\n  followups_due() returns {len(due)} contacts ready to receive follow-up email.")
print(f"  Cap means at most {s.daily_email_cap} will fly today.")

if due:
    print(f"\n  Sample 5 contacts the bot will follow up with today:")
    for r in due[:5]:
        print(f"    - {r['recipient']:<35s}  (company: {r['company']}, sent: {r['sent_at'][:10]})")
