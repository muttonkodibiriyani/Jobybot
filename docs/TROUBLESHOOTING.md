# Troubleshooting

## "Gmail SMTP auth failed"

You need an **App Password**, not your regular Gmail password.

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for App Passwords)
3. Go to https://myaccount.google.com/apppasswords
4. App name: "Jobybot" → **Create**
5. Copy the 16-character password (with spaces is fine)
6. Paste into `.env`:
   ```
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

## "Resume not parsing / empty profile"

- Make sure `RESUME_PATH` in `.env` points to a real PDF file
- The PDF must be **text-based**, not a scanned image
- Try: `python jobybot.py init` to re-parse

If still empty, check `data/resume_profile.json` to see what was extracted, then add missing skills/titles manually.

## "No jobs found"

- LinkedIn guest API sometimes rate-limits. Wait 30 min and retry.
- Lower `MATCH_THRESHOLD` to `30` to be less picky
- Add more variations to `TARGET_TITLES` (e.g. add `"Lead Product Manager,Product Lead"`)
- Run `python jobybot.py doctor` to verify config

## "Emails going to spam"

Normal for cold outreach. Mitigations already built in:
- Plain text body (no spammy HTML)
- Personalized subject with your name
- Reasonable rate limit (default 80/day)

To improve further:
- Use your own custom domain Gmail (Google Workspace) instead of `@gmail.com`
- Warm up the sending address by sending a few normal emails first

## "Scheduler not running after reboot"

**Windows:**
```powershell
Get-ScheduledTask Jobybot
Start-ScheduledTask Jobybot
```

**macOS:**
```bash
launchctl list | grep jobybot
launchctl load ~/Library/LaunchAgents/com.jobybot.scheduler.plist
```

**Linux:**
```bash
systemctl --user status jobybot
systemctl --user restart jobybot
# To survive reboots without logging in:
sudo loginctl enable-linger $USER
```

## "Daily cap reached too fast"

Lower `DAILY_EMAIL_CAP=40` or wait for next UTC midnight. Each market has 30-80 contacts so 80/day spreads naturally.

## "Want to add more contacts"

Edit the JSON file in `markets/` for the country. Format:
```json
{"company": "Acme Corp", "email": "careers@acme.com", "category": "Employer"}
```

Categories: `Recruiter`, `Employer`, `Consulting`, `Tech`, `Retail`.

## Getting help

Open an issue at https://github.com/muttonkodibiriyani/Jobybot/issues with:
- Your OS + Python version
- The exact error
- Contents of `data/jobybot.log` (redact your email/phone)
