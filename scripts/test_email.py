"""Helper: send a test email to yourself (proves Gmail works)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from pathlib import Path
from config import get_settings
from core.email_sender import send_email

s = get_settings()
ok, msg = send_email(
    s.gmail_address,
    s.gmail_app_password,
    s.user_email,
    "Jobybot Test — Your bot is working",
    (
        "Hi!\n\n"
        "If you received this email, it means your Jobybot is configured correctly:\n"
        "  ✓ Gmail App Password works\n"
        "  ✓ CV attachment works\n"
        "  ✓ SMTP delivery works\n\n"
        "Your bot is now ready to send real job applications.\n\n"
        "— Jobybot\n"
    ),
    Path(s.resume_path),
    s.user_name,
)

if ok:
    print(f"\n  ✓ Test email sent to {s.user_email}")
    print("  Check your inbox in 30 seconds.")
else:
    print(f"\n  ✗ Test email FAILED: {msg}")
    print("  Common causes:")
    print("    - GMAIL_APP_PASSWORD in .env is wrong → re-create at https://myaccount.google.com/apppasswords")
    print("    - 2-Step Verification not enabled on Google account")
    print("    - Internet connection issue")
