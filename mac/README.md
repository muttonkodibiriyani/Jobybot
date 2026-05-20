# JobyBots on macOS — How to Use

Welcome! These `.command` files work the same way `.bat` files work on Windows: **just double-click them**.

## First-time setup (do this once)

1. **Double-click `Setup.command`** in this folder.
   - macOS will warn you the first time. Open **System Settings → Privacy & Security → "Open Anyway"** if it complains.
   - The Terminal window will install Python packages, ask you to fill in `.env`, and run a health check.

2. **Fill in your `.env` settings** when TextEdit opens. You need:
   - `USER_NAME`, `USER_EMAIL`, `USER_PHONE`, `USER_LINKEDIN`
   - `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` ([create one here](https://myaccount.google.com/apppasswords))
   - `GEMINI_API_KEY` ([get one free here](https://aistudio.google.com/apikey))

3. **Drop your résumé** as `resume.pdf` into the JobyBots folder (one level up).

## Daily use

| Double-click this | What it does |
|---|---|
| `JobyBot.command` | Main menu — pick what you want |
| `RunBotNow.command` | Run one full job search + email cycle (15–30 min) |
| `Dashboard.command` | Open the live dashboard in your browser |
| `StartAutoSchedule.command` | Run automatically every 30 min, even after you log out |
| `StopBot.command` | Stop the auto-schedule |

## "Cannot be opened because the developer cannot be verified"

This shows the first time. To fix:

1. **Right-click** the `.command` file → **Open** → confirm.
2. Or open **System Settings → Privacy & Security**, scroll to the bottom, and click **"Open Anyway"** next to the script name.

You only need to do this once per script.

## Requirements

- macOS 12 (Monterey) or newer — works on Intel Macs *and* Apple Silicon (M1/M2/M3/M4).
- Python 3.10+. If you don't have it, the setup script will tell you how to install via [Homebrew](https://brew.sh) (`brew install python@3.12`) or the [python.org installer](https://www.python.org/downloads/macos/).
- A Gmail account with an App Password (not your regular password — [instructions here](https://myaccount.google.com/apppasswords)).
- A Gemini API key — free at [aistudio.google.com](https://aistudio.google.com/apikey).

## Where things live on macOS

- **Virtual environment:** `.venv/` in the JobyBots folder
- **Settings:** `.env` (locked to your user with `chmod 600`)
- **Logs:** `data/jobybot_launchd.log`
- **Click-to-apply job list:** `data/click_apply_inbox.html`
- **Auto-schedule plist:** `~/Library/LaunchAgents/com.jobybots.scheduler.plist`

## Need help?

- Email: **tharakesh.iitp@gmail.com**
- WhatsApp: **+91 7989931325**
- FAQ: **https://jobybots.com/faq**
