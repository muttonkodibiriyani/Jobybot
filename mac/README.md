# JobyBots — macOS install guide

> Tested on macOS 12 Monterey, 13 Ventura, 14 Sonoma, 15 Sequoia.
> Works on Intel Macs and Apple Silicon (M1 / M2 / M3 / M4).

This folder contains everything you need to install, configure and run JobyBots
on a Mac. Every action is a **double-click on a `.command` file**.

---

## What you'll see in this folder

| File | What it does |
|---|---|
| `Setup.command`         | First-run installer. Sets up Python, libraries, `.env`, runs a health check. **Run this first.** |
| `JobyBot.command`       | The control center menu — open this any time you want to do anything. |
| `RunBotNow.command`     | Run one full cycle right now (15–30 minutes). Window stays open so you can watch. |
| `StartAutoSchedule.command` | Installs a `launchd` agent that runs the bot every 30 minutes, even after you log out. |
| `StopBot.command`       | Removes the `launchd` agent and kills any running cycle. |
| `Dashboard.command`     | Opens the live HTML dashboard in your browser. |

---

## Step-by-step install (first time, ~5 minutes)

### 1. Download and unzip

Drag the `JobyBots-Mac.zip` (from your purchase email) to your **Desktop** and
double-click to extract. You'll get a folder called `JobyBots-Pro`.

### 2. Allow `.command` files to run

macOS quarantines downloaded files. Open Terminal once and clear the quarantine
flag (or just see the macOS Gatekeeper popup the first time and click **Open**):

```bash
# Optional — only if Gatekeeper keeps blocking
xattr -d com.apple.quarantine ~/Desktop/JobyBots-Pro/mac/*.command 2>/dev/null
```

If you don't run that, the **first time** you double-click `Setup.command` macOS
will say *"Setup.command can't be opened because it is from an unidentified
developer."* — right-click the file and choose **Open**, then **Open** in the
dialog. This happens **only once**.

### 3. Double-click `Setup.command`

Terminal opens and walks you through:

1. Locating Python 3.10+ (offers Homebrew install if missing)
2. Creating a `.venv/` virtual environment in the JobyBots folder
3. Installing all Python libraries from `python-deps.txt`
4. Opening `.env` in TextEdit so you can fill in 5 values:
   - `USER_NAME`, `USER_EMAIL`, `USER_PHONE`, `USER_LINKEDIN`
   - `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`
   - `GEMINI_API_KEY`
5. Locking down `.env` and `*.pdf` to owner-only (`chmod 600`)
6. Running a health check that tests Gmail SMTP and the Gemini key

When the green `SETUP COMPLETE` banner appears, you're done.

> **Don't have those keys yet?** Use the wizard at
> **https://jobybots.com/setup** — it generates a ready-to-drop `.env` file in
> your browser without your credentials ever touching our server.

### 4. Run your first cycle

Double-click `RunBotNow.command`. The dashboard opens in your browser and
auto-refreshes every 15 seconds while the cycle runs.

### 5. Schedule it 24/7 (optional but recommended)

Double-click `StartAutoSchedule.command`. The bot will now run every 30 minutes
even when you're not logged in. To stop it, double-click `StopBot.command`.

---

## What gets created on your Mac

```
~/Desktop/JobyBots-Pro/
  ├── .env                         (your settings, chmod 600)
  ├── .venv/                       (Python virtual environment, ~80 MB)
  ├── data/
  │   ├── jobybot.db               (SQLite — already-applied jobs)
  │   ├── dashboard.html           (open this any time)
  │   ├── click_apply_inbox.html   (LinkedIn Easy Apply queue)
  │   └── jobybot_launchd.log      (only if you scheduled)
  └── resume.pdf                   (you drop this in)

~/Library/LaunchAgents/
  └── com.jobybots.scheduler.plist  (only if you scheduled)
```

Nothing is installed system-wide. No admin password is ever asked.
**Removing JobyBots = drag the folder to Trash + double-click `StopBot.command`
once.**

---

## Why is `.command` safe? (skim if you're worried)

A `.command` file is **plain text** — open it in TextEdit and read every line
yourself. It's the macOS equivalent of a `.bat` on Windows. JobyBots' six
`.command` files together are about 250 lines of bash — no obfuscation,
no compiled binaries, no admin privileges, no network calls except:

- Job board scraping (LinkedIn, Bayt, Naukrigulf, GulfTalent, Indeed, RemoteOK)
- Gmail SMTP (smtp.gmail.com:587 — TLS, only your account)
- Gemini API (generativelanguage.googleapis.com — only with your key)

Full security write-up: **https://jobybots.com/security**

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| *"Setup.command cannot be opened"* | Right-click → Open. Or run `xattr -d com.apple.quarantine` on the file. |
| *"command not found: python3"* | Install via Homebrew: `brew install python@3.12` then re-run Setup. |
| *Gmail SMTP login fails* | You need an **App Password**, not your normal password. Generate at https://myaccount.google.com/apppasswords (2FA must be on). |
| *Gemini API errors* | Get a free key at https://aistudio.google.com/apikey and paste it in `.env`. |
| *Auto-schedule not firing* | Check `~/Library/LaunchAgents/com.jobybots.scheduler.plist` exists. Re-run `StartAutoSchedule.command`. View logs: `tail -f data/jobybot_launchd.log`. |
| *Dashboard.command does nothing* | Run `RunBotNow.command` once first — the dashboard is generated by the bot. |

---

## Need help?

- WhatsApp the founder: see `/contact` on the website
- Email: `tharakesh.iitp@gmail.com`
- Mon-Sat 10:00-20:00 IST. No bots, no tickets — the founder reads every message.
