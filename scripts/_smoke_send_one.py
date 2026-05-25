"""Live smoke test: send ONE real Gmail send to your own address.

Proves end-to-end that:
  - DRAFT_MODE=false routes to real SMTP
  - SMTP auth works
  - Render pipeline (subject + body) works
  - DB logs the send
"""
import _root  # noqa: F401
import sys

from core import db, email_sender
from config import get_settings

db.init_db()
s = get_settings()

print(f"\n  Gmail account : {s.gmail_address}")
print(f"  DRAFT_MODE    : {s.draft_mode}")
print(f"  Daily cap     : {s.daily_email_cap}\n")

# Profile minimal stub from settings.
profile = {
    "name":      s.user_name,
    "email":     s.user_email,
    "phone":     s.user_phone,
    "linkedin":  s.user_linkedin,
    "location":  s.user_location,
    "visa":      s.user_visa,
    "notice":    s.user_notice,
    "summary":   s.user_summary,
    "titles":    [t.strip() for t in s.target_titles.split(",")],
    "skills":    [],
}

# Send to YOUR OWN address as a smoke test (won't bounce, won't spam strangers)
recipient = s.gmail_address
print(f"  Sending live smoke test to: {recipient}")
print(f"  (this will appear in your own inbox)\n")

# Use a temporary marker company so we don't pollute the emails_sent dedupe
import datetime as _dt
mark = _dt.datetime.now().strftime("%H%M%S")
company = f"Smoke Test {mark}"

ok = email_sender.send_application(
    s,
    recipient=recipient,
    company=company,
    category="Employer",
    profile=profile,
    job_title="Senior Product Manager",
    job_description=(
        "Smoke-test send. If you receive this message in your Gmail inbox, "
        "the full pipeline (compose, render, SMTP, log) is working."
    ),
)
print(f"\n  Result: {'SENT' if ok else 'NOT SENT (see logs above)'}")
sys.exit(0 if ok else 1)
