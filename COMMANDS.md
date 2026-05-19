# 💻 Jobybot — Complete PowerShell Commands Cheat Sheet

**For everyone — copy, paste, press Enter. That's it.**

This file lists every command you'll ever need to run Jobybot from your own computer. No coding knowledge required.

**Master reference (all commands):** [`docs/POWERSHELL_COMPLETE.md`](docs/POWERSHELL_COMPLETE.md) — jobs, logs, schedule, limits, sources, security.

**Also read:** `docs/USER_GUIDE.md` · **Double-click:** `RUN_BOT_NOW.bat` · `JOBYBOT.bat` · `SETUP_FOR_FRIENDS.bat` (install for friends) · `SECURITY_CHECK.bat` · `SYNC_GITHUB.bat`

**Daily email limit:** 200/day (set `DAILY_EMAIL_CAP=200` in `.env`). If you still see cap **80**, your `.env` was not updated — change that line and save.

---

## 🎓 How to use this file

1. Find the section that describes what you want to do
2. Copy the command (the lines in the grey/black boxes)
3. Open PowerShell:
   - **Easiest way:** Hold `Shift` + right-click inside your `Jobybot` folder → click **"Open PowerShell window here"** (or **"Open in Terminal"**)
   - **Other way:** Press `Windows key`, type `PowerShell`, press Enter
4. Paste the command (right-click in the window, or press `Ctrl+V`)
5. Press `Enter`

⚠️ **Important:** Many commands assume your Jobybot folder is at `C:\Users\<YourName>\Downloads\Jobybot`. If yours is elsewhere, replace that path. Or just **cd to your Jobybot folder first** (see Section 1).

---

## 📑 Table of Contents

1. [Open and navigate to Jobybot folder](#1-open-the-jobybot-folder)
2. [Check if everything is set up correctly](#2-check-if-everything-is-set-up-correctly)
3. [Start the bot](#3-start-the-bot)
4. [See what the bot is doing](#4-see-what-the-bot-is-doing-live)
5. [Check statistics](#5-check-how-many-emails-applications)
6. [View jobs found](#6-view-the-jobs-jobybot-found)
7. [Stop the bot](#7-stop-the-bot)
8. [Restart the bot](#8-restart-the-bot)
9. [Emergency shutdown (panic button)](#9-emergency-shutdown--panic-button)
10. [Run just one search or one email blast](#10-run-just-one-search-or-one-email-blast)
11. [Make it auto-start at every login](#11-make-it-auto-start-on-every-login)
12. [Stop it from auto-starting](#12-stop-it-from-auto-starting)
13. [Backup your data](#13-backup-your-data)
14. [Reset everything (start fresh)](#14-reset-everything-start-fresh)
15. [Update Jobybot to latest version](#15-update-jobybot-to-the-latest-version)
16. [View the live job inbox in your browser](#16-open-the-live-job-inbox-in-your-browser)
17. [Change your settings](#17-change-your-settings)
18. [Common error messages — what they mean](#18-common-errors--what-they-mean)
19. [Send a test email to yourself](#19-send-yourself-a-test-email)
20. [Uninstall completely](#20-uninstall-completely)

---

## 1. Open the Jobybot folder

Open PowerShell and go to the bot folder. From this point on, all other commands work.

```powershell
cd "$env:USERPROFILE\Downloads\Jobybot"
```

If your Jobybot is somewhere else, replace the path:

```powershell
cd "C:\Path\To\Your\Jobybot"
```

You should see your prompt change to show the Jobybot folder.

---

## 2. Check if everything is set up correctly

This runs a "health check" — confirms your resume, Gmail password, and config are all working.

```powershell
.\.venv\Scripts\python.exe jobybot.py doctor
```

You should see all green ✓ checkmarks. If you see any ✗ marks, fix those items first.

---

## 3. Start the bot

There are **3 ways** to start, depending on what you want:

### 3A. Run ONE FULL CYCLE right now (search + email blast)
Best to use this the first time — takes 10-15 minutes total.

```powershell
.\.venv\Scripts\python.exe jobybot.py run
```

The window stays open and shows live progress. Don't close it until you see "Done".

### 3B. Start the 24/7 SCHEDULER (recommended for daily use)
This runs cycles automatically every hour. Keep the window open in the background.

```powershell
.\.venv\Scripts\python.exe jobybot.py schedule
```

Press `Ctrl + C` in this window to stop it.

### 3C. Start the scheduler in the BACKGROUND (no window stays open)
Best for "set and forget":

```powershell
Start-Process -WindowStyle Hidden -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
```

The bot now runs invisibly. To check it, use Section 4 below.

---

## 4. See what the bot is doing (LIVE)

### See the latest 30 lines of the bot's diary

```powershell
Get-Content data\jobybot.log -Tail 30
```

### Watch the bot work LIVE (auto-updating, like a TV channel)

```powershell
Get-Content data\jobybot.log -Tail 30 -Wait
```

Press `Ctrl + C` to stop watching (the bot keeps running).

### Open the log in Notepad

```powershell
notepad data\jobybot.log
```

---

## 5. Check how many emails / applications

Quick summary of bot activity:

```powershell
.\.venv\Scripts\python.exe jobybot.py stats
```

You'll see:
```
  Jobs found     : 335
  Applied        : 0
  Emails sent    : 47
  Emails today   : 47/200
```

---

## 6. View the jobs Jobybot found

### Show the 20 highest-matched jobs in PowerShell

```powershell
.\.venv\Scripts\python.exe -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); rows=c.execute(\"SELECT match_score, title, company FROM jobs WHERE status='found' ORDER BY match_score DESC LIMIT 20\").fetchall(); [print(f'[{r[0]}] {r[1][:50]} @ {r[2]}') for r in rows]"
```

### Show ALL jobs

```powershell
.\.venv\Scripts\python.exe -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); rows=c.execute(\"SELECT match_score, title, company, url FROM jobs WHERE status='found' ORDER BY match_score DESC\").fetchall(); [print(f'[{r[0]}] {r[1]} @ {r[2]}') for r in rows]; print(f'\nTotal: {len(rows)} jobs')"
```

### Open the pretty HTML inbox in your browser (recommended!)

```powershell
Start-Process data\click_apply_inbox.html
```

### Show 20 most recent emails sent (with timestamps)

```powershell
.\.venv\Scripts\python.exe -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); rows=c.execute('SELECT sent_at, company, recipient FROM emails_sent ORDER BY sent_at DESC LIMIT 20').fetchall(); [print(f'{r[0][:19]} | {r[1]:30s} {r[2]}') for r in rows]"
```

---

## 7. Stop the bot

### Stop politely (if you started it with Ctrl+C in mind)

Click on the PowerShell window where the bot is running and press `Ctrl + C`. Wait a few seconds — it cleanly shuts down.

### Stop the BACKGROUND bot (when you used 3C)

```powershell
Get-Process python | Where-Object { $_.Path -like "*Jobybot*" } | Stop-Process -Force
```

### Stop ALL Python processes (if the polite method doesn't work)

```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
```

⚠️ Note: This stops every Python program on your computer, not just Jobybot. Only use if you're sure no other Python is running.

---

## 8. Restart the bot

If the bot crashed or got stuck:

```powershell
# Stop it first
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start it again
Start-Process -WindowStyle Hidden -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
Write-Host "Bot restarted in background"
```

---

## 9. Emergency shutdown — "PANIC BUTTON"

If you want to **stop everything immediately** — no questions asked:

```powershell
# Stop running bot
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove auto-start so it doesn't come back
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue

# Remove daily scheduled task
schtasks /Delete /TN "JobybotDaily" /F 2>$null

Write-Host "EMERGENCY SHUTDOWN COMPLETE. Bot is fully stopped." -ForegroundColor Red
Write-Host "It will not restart on next reboot."
Write-Host "Your data is safe in data\jobybot.db"
```

To bring the bot back later, just run Section 11 (auto-start) again.

---

## 10. Run just one search or one email blast

### Search for new jobs only (don't send any emails)

```powershell
.\.venv\Scripts\python.exe jobybot.py search
```

### Send emails only (don't search for new jobs)

```powershell
.\.venv\Scripts\python.exe jobybot.py email
```

---

## 11. Make it auto-start on every login

Run this once, and the bot will launch automatically every time you log into Windows:

```powershell
$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk")
$lnk.TargetPath = "cmd.exe"
$lnk.Arguments  = "/c `"$PWD\.venv\Scripts\python.exe`" `"$PWD\jobybot.py`" schedule >> `"$PWD\data\scheduler.log`" 2>&1"
$lnk.WorkingDirectory = $PWD.Path
$lnk.WindowStyle = 7
$lnk.Save()
Write-Host "✓ Auto-start enabled. Reboot to test, or run the bot manually for now." -ForegroundColor Green
```

Also create a safety-net daily 9 AM task (in case the startup one fails):

```powershell
$batPath = "$PWD\_run_scheduler.bat"
@"
@echo off
cd /d "$PWD"
set PYTHONIOENCODING=utf-8
"$PWD\.venv\Scripts\python.exe" "$PWD\jobybot.py" schedule >> "$PWD\data\scheduler-stdout.log" 2>&1
"@ | Set-Content $batPath -Encoding ASCII

schtasks /Create /TN "JobybotDaily" /TR "`"$batPath`"" /SC DAILY /ST 09:00 /F
Write-Host "✓ Daily 9 AM safety net registered." -ForegroundColor Green
```

---

## 12. Stop it from auto-starting

```powershell
# Remove the startup shortcut
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue

# Remove the daily scheduled task
schtasks /Delete /TN "JobybotDaily" /F 2>$null

Write-Host "Auto-start removed. The bot will NOT launch automatically anymore."
Write-Host "Currently running bot is unaffected — kill it separately if needed."
```

---

## 13. Backup your data

Save your bot's database, logs, and config to your Desktop. Useful before resetting or moving to a new computer:

```powershell
$backup = "$env:USERPROFILE\Desktop\Jobybot-Backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item ".env"            "$backup\.env"           -ErrorAction SilentlyContinue
Copy-Item "data"            "$backup\data"           -Recurse -ErrorAction SilentlyContinue
Copy-Item "resume.pdf"      "$backup\resume.pdf"     -ErrorAction SilentlyContinue
Copy-Item "*.pdf"           $backup                  -ErrorAction SilentlyContinue
Write-Host "Backup created: $backup" -ForegroundColor Green
```

---

## 14. Reset everything (start fresh)

⚠️ **This deletes all your bot's memory** — every job found, every email sent. The bot will start sending duplicate emails to people you already contacted. Only use this if you really want a clean slate.

```powershell
# Stop the bot first
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Backup first (just in case)
$backup = "$env:USERPROFILE\Desktop\Jobybot-PreReset-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
Copy-Item "data" $backup -Recurse -ErrorAction SilentlyContinue
Write-Host "Backup saved to: $backup"

# Wipe the data folder
Remove-Item "data" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Bot data has been reset. Run 'jobybot.py init' to start fresh."
```

---

## 15. Update Jobybot to the latest version

If new features are released on GitHub:

```powershell
# Step 1: Backup your data and config
$backup = "$env:USERPROFILE\Desktop\Jobybot-Backup-$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item ".env"       "$backup\.env"        -ErrorAction SilentlyContinue
Copy-Item "data"       "$backup\data"        -Recurse -ErrorAction SilentlyContinue
Copy-Item "resume.pdf" "$backup\resume.pdf"  -ErrorAction SilentlyContinue
Write-Host "Backup at: $backup"

# Step 2: Stop the bot
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Step 3: Download the latest release
# Open https://github.com/muttonkodibiriyani/Jobybot in your browser and download the ZIP
# Extract it over your existing Jobybot folder (keep YOUR .env, resume.pdf, and data folder!)

# Step 4: Re-install dependencies
.\.venv\Scripts\python.exe -m pip install -r python-deps.txt --upgrade

# Step 5: Start it again
Start-Process -WindowStyle Hidden -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
Write-Host "Updated and restarted."
```

---

## 16. Open the live job inbox in your browser

This is the prettiest view — all your matched jobs sorted by score, with one-click apply buttons:

```powershell
Start-Process data\click_apply_inbox.html
```

The page **auto-refreshes every 10 minutes**, so leave it open in a browser tab. Just hit refresh on your browser to see new jobs.

---

## 17. Change your settings

Open the `.env` file in Notepad to edit:

```powershell
notepad .env
```

Common things you might want to change:
- `DAILY_EMAIL_CAP=200` → lower this if Gmail flags emails as spam, e.g. `100`
- `TARGET_TITLES="..."` → add/remove job titles
- `SECONDARY_MARKETS="..."` → change which countries to target
- `RUN_INTERVAL_MINUTES=60` → change to `120` for every 2 hours

After saving the file (`Ctrl+S`), the next hourly cycle will use the new settings. Or restart immediately:

```powershell
# Restart to apply changes now
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
Start-Process -WindowStyle Hidden -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
Write-Host "Bot restarted with new settings"
```

---

## 18. Common errors — what they mean

### "Python is not recognized as a command"
You haven't installed Python, or you didn't tick "Add to PATH" during install.
- **Fix:** Re-install Python from https://python.org/downloads — and tick **`Add python.exe to PATH`** at the bottom of the installer.

### "Cannot run scripts is disabled on this system"
PowerShell's safety setting is blocking the installer. Run this once, then retry:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### "ModuleNotFoundError: No module named 'X'"
The bot's libraries aren't installed (Python venv was deleted, etc.). Fix:

```powershell
.\.venv\Scripts\python.exe -m pip install -r python-deps.txt
```

### "Gmail SMTP auth failed"
Your App Password is wrong or expired.
- **Fix:** Get a new one at https://myaccount.google.com/apppasswords and paste into `.env` as `GMAIL_APP_PASSWORD=`.

### "Field required: gmail_address"
Your `.env` file is empty or missing. Look for `.env.example` in the folder, copy it to `.env`, and fill in your details.

### "Resume not found"
Either rename your CV to exactly `resume.pdf` and put it in the Jobybot folder, OR change `RESUME_PATH=` in `.env` to the full path of your PDF.

### "Daily cap reached"
Normal! The bot stops at your `DAILY_EMAIL_CAP` (default **200** emails/day). If the message still says **80**, open `.env` and set `DAILY_EMAIL_CAP=200`, save, then try again tomorrow. It resumes the next calendar day.

### Bot is running but no emails are sent
Check the log:

```powershell
Get-Content data\jobybot.log -Tail 50 | Select-String -Pattern "ERROR|WARN|auth"
```

---

## 19. Send yourself a test email

Verify Gmail works:

```powershell
.\.venv\Scripts\python.exe -c "from config import get_settings; from core.email_sender import send_email; from pathlib import Path; s=get_settings(); ok,msg = send_email(s.gmail_address, s.gmail_app_password, s.user_email, 'Jobybot test', 'If you see this, your Gmail App Password works.', Path(s.resume_path), s.user_name); print('OK' if ok else f'FAIL: {msg}')"
```

You should get an email to yourself within 30 seconds.

---

## 20. Uninstall completely

```powershell
# Stop the bot
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove auto-start
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
schtasks /Delete /TN "JobybotDaily" /F 2>$null

# Save your backup first!
$backup = "$env:USERPROFILE\Desktop\Jobybot-FinalBackup-$(Get-Date -Format 'yyyy-MM-dd')"
Copy-Item "data" $backup -Recurse -ErrorAction SilentlyContinue
Write-Host "Backup: $backup"

# Now you can delete the Jobybot folder manually in File Explorer.
Write-Host ""
Write-Host "Jobybot fully uninstalled."
Write-Host "Your job data is backed up at: $backup"
Write-Host "You can now delete the Jobybot folder if you want."
```

---

## 🎁 BONUS: All-in-one "Daily Check" command

Run this once per day to see everything important:

```powershell
Write-Host "`n═══════════════════ JOBYBOT DAILY CHECK ═══════════════════`n" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# Is it running?
$proc = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Jobybot*" }
if ($proc) {
    Write-Host "✓ Bot is RUNNING (PID $($proc.Id), started $($proc.StartTime))" -ForegroundColor Green
} else {
    Write-Host "✗ Bot is NOT running" -ForegroundColor Red
    Write-Host "  Start it with:  .\.venv\Scripts\python.exe jobybot.py schedule"
}

# Stats
Write-Host ""
.\.venv\Scripts\python.exe jobybot.py stats

# Last 10 actions
Write-Host "`n--- Last 10 bot actions ---" -ForegroundColor Cyan
Get-Content data\jobybot.log -Tail 10

# Last 5 emails sent
Write-Host "`n--- Last 5 emails sent ---" -ForegroundColor Cyan
.\.venv\Scripts\python.exe -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); rows=c.execute('SELECT sent_at, company, recipient FROM emails_sent ORDER BY sent_at DESC LIMIT 5').fetchall(); [print(f'{r[0][:19]} | {r[1]:30s} {r[2]}') for r in rows]"

Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
```

Save this as a `.ps1` file on your Desktop for one-click daily checks.

---

## 📞 Need more help?

- Read `HOW_TO_RUN.md` for first-time setup
- Read `README.md` for the FAQ
- Read `docs/TROUBLESHOOTING.md` for specific errors
- Report bugs at: https://github.com/muttonkodibiriyani/Jobybot/issues

🍀 Good luck on your job search!
