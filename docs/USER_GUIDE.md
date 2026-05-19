# Jobybot — Complete User Guide (Non-IT Friendly)

This guide explains **what Jobybot does**, **how to run it with one click**, and **every PowerShell command** you might need. You do not need to know programming.

**GitHub:** https://github.com/muttonkodibiriyani/Jobybot

---

## What Jobybot does (in plain English)

Jobybot is your **24/7 job-search assistant** on your own Windows PC. It:

1. **Searches** job boards (LinkedIn public search, Indeed, Bayt, Naukri Gulf, RemoteOK, etc.) for titles you configured (e.g. Product Manager, Business Analyst).
2. **Scores** each job against your resume and keeps the best matches in a local database.
3. **Sends personalized emails** with your CV attached to curated recruiters and employers in your target countries (UAE, Singapore, Germany, UK, etc.).
4. **Builds a web page** (`data\click_apply_inbox.html`) with one-click links for jobs where you apply on the company site or LinkedIn **Easy Apply** yourself (about 30 seconds per job).
5. **Runs on a schedule** (default: every 60 minutes) if you start background mode or enable auto-start.

### What it does NOT do (important)

- It does **not** log into LinkedIn or click "Easy Apply" for you automatically (LinkedIn forbids that; accounts get banned).
- It does **not** fill out arbitrary company career-site forms automatically. Those sites are all different; the bot gives you the **link** in the HTML inbox so you can apply quickly by hand.
- It **does** send real emails from **your** Gmail, like a motivated job seeker would — up to **200 per day** by default (configurable).

---

## One-click files (double-click in File Explorer)

| File | What it does |
|------|----------------|
| **JOBYBOT.bat** | Opens the friendly menu (start, stop, stats, emergency shutdown, etc.) |
| **RUN_BOT_NOW.bat** | Runs **one full cycle now**: search jobs + send emails + update inbox (~15–30 min) |
| **SYNC_GITHUB.bat** | Pulls latest version from GitHub and optionally pushes your changes |
| **_run_scheduler.bat** | Used internally for 24/7 mode and Windows auto-start (you rarely open this directly) |

**Recommended daily habit:** Double-click **RUN_BOT_NOW.bat** once in the morning, or use **JOBYBOT.bat** → option **2** (same thing with a menu).

---

## Daily email limit: 200 applications per day

The limit is controlled by **`DAILY_EMAIL_CAP`** in your `.env` file.

- **Default (new installs):** `200`
- If you still see **"Daily cap (80) already reached"**, your `.env` still has the old value.

**Fix in 30 seconds:**

1. Double-click **JOBYBOT.bat** → option **14** (Edit settings), **or** open Notepad on `Jobybot\.env`
2. Find the line `DAILY_EMAIL_CAP=80` and change it to:
   ```
   DAILY_EMAIL_CAP=200
   ```
3. Save the file (`Ctrl+S`)
4. Run **RUN_BOT_NOW.bat** again tomorrow after midnight, or wait until the next calendar day if the counter reset is by date

The bot counts emails sent **today** (local date in the database). When you hit 200, it stops sending until the next day but **can still search** for jobs.

---

## First-time setup (once only)

1. Install **Python 3.11+** from https://python.org/downloads — tick **"Add python.exe to PATH"**.
2. Put your CV in the folder as **`resume.pdf`** (or set `RESUME_PATH` in `.env`).
3. Copy **`.env.example`** to **`.env`** and fill in your name, phone, Gmail, and **Gmail App Password** (not your normal password): https://myaccount.google.com/apppasswords
4. In PowerShell, from the Jobybot folder:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
   .\install.ps1
   .\.venv\Scripts\python.exe jobybot.py init
   ```
5. Double-click **RUN_BOT_NOW.bat** to test one cycle.

Detailed steps: see **HOW_TO_RUN.md**.

---

## JOBYBOT.bat menu (all options)

| # | Action |
|---|--------|
| 1 | Start bot in **background** (runs 24/7, hourly cycles) |
| 2 | Run **one cycle now** (search + email) |
| 3 | **Stop** the bot |
| 4 | **Emergency shutdown** (stop + remove auto-start; type YES) |
| 5 | Watch **live log** (Ctrl+C exits log only) |
| 6 | **Statistics** (jobs, emails today / 200) |
| 7 | Top 20 matched jobs |
| 8 | Last 20 emails sent |
| 9 | Open **click_apply_inbox.html** in browser |
| 10 | Search jobs only |
| 11 | Send emails only |
| 12 | Health check |
| 13 | Send test email to yourself |
| 14 | Edit `.env` |
| 15 | Enable auto-start on Windows login |
| 16 | Disable auto-start |
| 17 | Backup to Desktop |
| 18 | Reset bot memory (type RESET; backs up first) |
| 0 | Exit menu (bot keeps running if started) |

---

## PowerShell commands (copy-paste)

Open PowerShell in the Jobybot folder: **Shift + right-click** the folder → **Open in Terminal**, then:

```powershell
cd "$env:USERPROFILE\Downloads\Jobybot"
```

Replace the path if your folder is elsewhere.

### Navigate

```powershell
cd "$env:USERPROFILE\Downloads\Jobybot"
```

### Health check

```powershell
.\.venv\Scripts\python.exe jobybot.py doctor
```

### Start 24/7 background bot

```powershell
Start-Process -WindowStyle Hidden -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
```

### Run one cycle (search + email) — same as RUN_BOT_NOW.bat

```powershell
.\.venv\Scripts\python.exe jobybot.py run
```

### Search jobs only

```powershell
.\.venv\Scripts\python.exe jobybot.py search
```

### Send emails only

```powershell
.\.venv\Scripts\python.exe jobybot.py email
```

### View statistics

```powershell
.\.venv\Scripts\python.exe jobybot.py stats
```

### View top jobs

```powershell
.\.venv\Scripts\python.exe scripts\top_jobs.py
```

### View recent emails

```powershell
.\.venv\Scripts\python.exe scripts\recent_emails.py
```

### Open job inbox in browser

```powershell
Start-Process data\click_apply_inbox.html
```

### Watch live log

```powershell
Get-Content data\jobybot.log -Tail 30 -Wait
```

### Stop the bot

```powershell
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Jobybot*" } | Stop-Process -Force
```

### Emergency shutdown (stop + remove auto-start)

```powershell
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Jobybot*" } | Stop-Process -Force
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
schtasks /Delete /TN "JobybotDaily" /F 2>$null
schtasks /Delete /TN "Jobybot" /F 2>$null
Write-Host "Emergency shutdown complete."
```

### Restart after changing .env

```powershell
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Jobybot*" } | Stop-Process -Force
Start-Sleep -Seconds 3
Start-Process -WindowStyle Hidden -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
```

### Sync with GitHub (if you use Git)

```powershell
git pull origin main
# or: double-click SYNC_GITHUB.bat
```

**Full command list with more scenarios:** **COMMANDS.md** (in the project root).

---

## Common scenarios

### "Daily cap (80) already reached"

Your `.env` still has `DAILY_EMAIL_CAP=80`. Change to `200`, save, try again tomorrow.

### Bot runs but sends zero emails

- Run health check: `jobybot.py doctor`
- Check log: `Get-Content data\jobybot.log -Tail 50`
- Verify Gmail App Password in `.env`
- You may have already emailed all contacts in today's markets; run **search** and use the HTML inbox for new companies

### Gmail / spam issues

Lower the cap temporarily in `.env`, e.g. `DAILY_EMAIL_CAP=100`

### Want more job titles or countries

Edit `.env`: `TARGET_TITLES` and `SECONDARY_MARKETS`, then restart the bot.

### Update from GitHub without losing your data

1. Backup: menu option **17** or copy `.env`, `data\`, `resume.pdf` to Desktop
2. Double-click **SYNC_GITHUB.bat** or `git pull`
3. Run: `.\.venv\Scripts\python.exe -m pip install -r python-deps.txt --upgrade`

### Uninstall

See section 20 in **COMMANDS.md**.

---

## Folder map (what matters)

| Path | Purpose |
|------|---------|
| `.env` | Your secrets and settings (never share publicly) |
| `resume.pdf` | Your CV attached to emails |
| `data/jobybot.db` | Jobs and email history |
| `data/jobybot.log` | Activity log |
| `data/click_apply_inbox.html` | Visual list of jobs to apply manually |
| `.venv/` | Python packages (created by install.ps1) |

---

## Safety and ethics

- Emails are sent from **your** Gmail with your real identity.
- Rate limits protect your account (200/day default).
- LinkedIn Easy Apply is **manual** via the inbox links by design.

Good luck with your search.
