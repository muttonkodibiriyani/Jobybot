# Jobybot Security Guide

Jobybot is **self-hosted**: it runs only on your PC, uses your Gmail to send mail, and stores data locally. There is no Jobybot cloud server and no account on our servers.

This document explains what is protected, what you must do, and honest limits.

---

## What Jobybot does NOT do (attack surface)

| Risk | Status |
|------|--------|
| Remote hackers connecting in | **No** — Jobybot does not open ports or run a web server |
| Storing your password on GitHub | **No** — `.env` is in `.gitignore` |
| Sending data to a Jobybot company server | **No** — only outbound HTTPS to job sites and Gmail SMTP |
| Auto-running random scripts from the internet | **No** — only code in your folder runs |
| LinkedIn login / password storage | **No** — public guest search only |

---

## What you must protect

### 1. `.env` file

Contains your **Gmail App Password**. Treat it like a bank PIN.

- Run **SECURITY_CHECK.bat** after install (locks file to your Windows user)
- Never email, WhatsApp, or upload `.env` to Google Drive shared links
- Never commit `.env` to Git

### 2. `resume.pdf`

Personal data. Keep in the Jobybot folder; back up to your own private storage only.

### 3. `data/jobybot.db`

Lists jobs and who you emailed. Same rules as `.env`.

---

## How to harden your install

Run after setup and once a month:

```powershell
cd "$env:USERPROFILE\Downloads\Jobybot"
PowerShell -ExecutionPolicy Bypass -File .\scripts\secure_permissions.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\security_audit.ps1
```

Or double-click **SECURITY_CHECK.bat**.

### Use a Gmail App Password (required)

- Not your normal Gmail password
- Create at https://myaccount.google.com/apppasswords (2FA required)
- Revoke old app passwords you no longer use

### Download only from official GitHub

https://github.com/muttonkodibiriyani/Jobybot

Do not run copies from unknown links — they could contain malware.

### Windows updates & antivirus

Keep Windows Defender (or your AV) enabled. Jobybot is Python scripts, not an `.exe` from an unknown vendor.

### Sharing with friends

**Safe to share:** the GitHub ZIP or repo **without** your `.env`, `data/`, or `resume.pdf`.

**Friend runs:** `SETUP_FOR_FRIENDS.bat` and enters **their own** Gmail App Password.

---

## Technical safeguards in code

- **SQL:** Parameterized queries (no string-built SQL)
- **HTTPS:** `requests` uses TLS certificate verification (default)
- **Timeouts:** HTTP calls timeout after 6 seconds
- **Secrets:** Loaded from `.env` via pydantic-settings; not hardcoded
- **Logs:** Passwords are not written to `jobybot.log` by design
- **No `eval` / `exec`** on user input in the application path

---

## Honest limits (no tool is “unhackable”)

- If someone **physically uses your PC** while logged in, they can read `.env`.
- If you install a **fake Jobybot** with malware, Windows antivirus is your protection — use official source only.
- If your **Gmail account** is compromised separately, rotate App Passwords immediately.
- **Phishing:** Jobybot will never ask for your password in an email.

---

## If you suspect a problem

1. Run **Emergency shutdown** (JOBYBOT.bat option 4 or `docs/POWERSHELL_COMPLETE.md` section 3)
2. Revoke Gmail App Password at https://myaccount.google.com/apppasswords
3. Create a new App Password and update `.env`
4. Run **SECURITY_CHECK.bat**

---

## Reporting security issues

https://github.com/muttonkodibiriyani/Jobybot/issues

Do not post App Passwords or `.env` contents in public issues.
