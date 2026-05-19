# Jobybot — Complete PowerShell Command Reference

**Every command in one place.** Copy → paste → Enter. No coding needed.

| Also use | Purpose |
|----------|---------|
| **JOBYBOT.bat** | Visual menu (easiest) |
| **RUN_BOT_NOW.bat** | One cycle: search + email now |
| **SETUP_FOR_FRIENDS.bat** | First-time install + auto-schedule (share with friends) |
| **SECURITY_CHECK.bat** | Lock secrets + audit safety |
| **COMMANDS.md** | Shorter cheat sheet (sections 1–20) |

Open PowerShell in the Jobybot folder: **Shift + right-click** the folder → **Open in Terminal**.

```powershell
cd "$env:USERPROFILE\Downloads\Jobybot"   # change path if yours differs
$py = ".\.venv\Scripts\python.exe"
```

---

## Table of contents

1. [Is the bot running?](#1-is-the-bot-running)
2. [Start / stop / restart](#2-start--stop--restart)
3. [Emergency shutdown](#3-emergency-shutdown)
4. [View jobs (all sources)](#4-view-jobs-all-sources)
5. [Job search by website](#5-job-search-by-website)
6. [Emails sent & limits](#6-emails-sent--limits)
7. [Change daily email limit](#7-change-daily-email-limit)
8. [Schedule & timing](#8-schedule--timing)
9. [Enable / disable job sources](#9-enable--disable-job-sources)
10. [Edit all settings (.env)](#10-edit-all-settings-env)
11. [All log files](#11-all-log-files)
12. [Health check & test email](#12-health-check--test-email)
13. [Backup / reset / update](#13-backup--reset--update)
14. [Windows auto-start & tasks](#14-windows-auto-start--tasks)
15. [Security commands](#15-security-commands)
16. [Daily check (one paste)](#16-daily-check-one-paste)

---

## 1. Is the bot running?

```powershell
Get-Process python -ErrorAction SilentlyContinue |
  Where-Object { try { $_.Path -like "*Jobybot*" } catch { $false } } |
  Format-Table Id, ProcessName, StartTime, Path -AutoSize
```

If you see a row, the bot is running. Note the **Id** (PID).

```powershell
# Scheduled task status (if you used install / auto-start)
Get-ScheduledTask -TaskName "Jobybot" -ErrorAction SilentlyContinue |
  Select-Object TaskName, State
schtasks /Query /TN "JobybotDaily" /FO LIST 2>$null
```

---

## 2. Start / stop / restart

### Run one full cycle now (search + email + inbox HTML)

```powershell
& $py jobybot.py run
```

Or double-click **RUN_BOT_NOW.bat**.

### Start 24/7 scheduler (window visible)

```powershell
& $py jobybot.py schedule
```

Stop with **Ctrl+C** in that window.

### Start 24/7 in background (hidden)

```powershell
Start-Process -WindowStyle Hidden -FilePath $py `
  -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
```

### Search jobs only (no emails)

```powershell
& $py jobybot.py search
```

### Send emails only (no search)

```powershell
& $py jobybot.py email
```

### Stop Jobybot only (safe)

```powershell
Get-Process python -ErrorAction SilentlyContinue |
  Where-Object { try { $_.Path -like "*Jobybot*" } catch { $false } } |
  Stop-Process -Force
```

### Stop by PID (if you know it)

```powershell
Stop-Process -Id 12345 -Force   # replace 12345 with real PID
```

### Restart after config change

```powershell
Get-Process python -ErrorAction SilentlyContinue |
  Where-Object { try { $_.Path -like "*Jobybot*" } catch { $false } } |
  Stop-Process -Force
Start-Sleep -Seconds 3
Start-Process -WindowStyle Hidden -FilePath $py `
  -ArgumentList "jobybot.py","schedule" -WorkingDirectory $PWD
Write-Host "Restarted."
```

---

## 3. Emergency shutdown

Stops bot + removes auto-start + daily task. Type nothing else required.

```powershell
Get-Process python -ErrorAction SilentlyContinue |
  Where-Object { try { $_.Path -like "*Jobybot*" } catch { $false } } |
  Stop-Process -Force

Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
schtasks /Delete /TN "JobybotDaily" /F 2>$null
schtasks /Delete /TN "Jobybot" /F 2>$null
Unregister-ScheduledTask -TaskName "Jobybot" -Confirm:$false -ErrorAction SilentlyContinue

Write-Host "EMERGENCY SHUTDOWN COMPLETE" -ForegroundColor Red
Write-Host "Data safe in: $PWD\data\"
```

Or: **JOBYBOT.bat** → option **4** (type `YES`).

---

## 4. View jobs (all sources)

### Statistics summary

```powershell
& $py jobybot.py stats
```

### Top 20 matched jobs (readable)

```powershell
& $py scripts\top_jobs.py
```

### Open HTML inbox (best for applying)

```powershell
Start-Process data\click_apply_inbox.html
```

### All jobs in database (PowerShell)

```powershell
& $py -c @"
import sqlite3
c = sqlite3.connect('data/jobybot.db')
rows = c.execute('''
  SELECT match_score, source, title, company, location, url
  FROM jobs WHERE status='found'
  ORDER BY match_score DESC
''').fetchall()
for r in rows:
    print(f'[{r[0]:3}] {r[1]:12} | {r[2][:45]:45} @ {r[3]} | {r[4]}')
print(f'\nTotal: {len(rows)} jobs')
"@
```

### Jobs found today

```powershell
& $py -c @"
import sqlite3, datetime
today = datetime.date.today().isoformat()
c = sqlite3.connect('data/jobybot.db')
n = c.execute('SELECT COUNT(*) FROM jobs WHERE found_at LIKE ?', (today+'%',)).fetchone()[0]
print(f'Jobs added today: {n}')
"@
```

---

## 5. Job search by website

Jobybot searches these sites (public APIs / pages — **no login**):

| Source | `.env` flag | What it searches |
|--------|-------------|------------------|
| **LinkedIn** | `ENABLE_LINKEDIN_SEARCH=true` | Public guest job search (Easy Apply filter) |
| **Indeed** | `ENABLE_INDEED=true` | Indeed job listings by title + location |
| **Bayt** | `ENABLE_BAYT=true` | Bayt.com (Gulf) |
| **Naukri Gulf** | `ENABLE_NAUKRIGULF=true` | NaukriGulf |
| **RemoteOK** | `ENABLE_REMOTEOK=true` | Remote tech jobs |

**Note:** There is no separate “Google Jobs” scraper. Google does not provide a free API for this; Jobybot uses the sites above. `ENABLE_GULFTALENT` / `ENABLE_COMPANY_CAREERS` in `.env` are reserved for future use.

### Count jobs per source

```powershell
& $py scripts\jobs_by_source.py
```

### Show only LinkedIn jobs

```powershell
& $py -c @"
import sqlite3
c = sqlite3.connect('data/jobybot.db')
for r in c.execute(\"SELECT match_score, title, company, url FROM jobs WHERE source='LinkedIn' AND status='found' ORDER BY match_score DESC LIMIT 30\"):
    print(f'[{r[0]}] {r[1]} @ {r[2]}\n  {r[3]}\n')
"@
```

Replace `'LinkedIn'` with `Indeed`, `Bayt`, `NaukriGulf`, or `RemoteOK`.

### Force a fresh search from all enabled sources

```powershell
& $py jobybot.py search
Start-Process data\click_apply_inbox.html
```

---

## 6. Emails sent & limits

### Recent emails

```powershell
& $py scripts\recent_emails.py
```

### Today's email count vs cap

```powershell
& $py jobybot.py stats
```

### Who was emailed from a company

```powershell
& $py -c @"
import sqlite3
company = 'Deloitte'   # change name
c = sqlite3.connect('data/jobybot.db')
for r in c.execute('SELECT sent_at, recipient FROM emails_sent WHERE company LIKE ? ORDER BY sent_at DESC', ('%'+company+'%',)):
    print(r[0][:19], r[1])
"@
```

---

## 7. Change daily email limit

1. Open settings:

```powershell
notepad .env
```

2. Change (example — **200 per day**):

```env
DAILY_EMAIL_CAP=200
```

3. Save (`Ctrl+S`) and restart bot (section 2).

**Lower** if Gmail marks mail as spam (e.g. `100`). **Raise** only if your Gmail account can handle volume.

---

## 8. Schedule & timing

All in `.env`:

| Setting | Default | Meaning |
|---------|---------|---------|
| `RUN_INTERVAL_MINUTES` | `60` | How often the bot runs search + email when in `schedule` mode |
| `DAILY_SUMMARY_HOUR` | `9` | Hour (24h) for daily summary email to you |
| `MIN_DELAY_SEC` / `MAX_DELAY_SEC` | `30` / `120` | Random pause between each outbound email |

### Change to every 2 hours

```powershell
# Edit .env: RUN_INTERVAL_MINUTES=120
notepad .env
```

Then restart the bot (section 2).

### View when scheduler last logged activity

```powershell
Get-Content data\jobybot.log -Tail 20 | Select-String "CYCLE|Search complete|Email blast"
```

---

## 9. Enable / disable job sources

Edit `.env`:

```env
ENABLE_LINKEDIN_SEARCH=true
ENABLE_INDEED=true
ENABLE_NAUKRIGULF=true
ENABLE_BAYT=true
ENABLE_REMOTEOK=true
```

Set any line to `false` to skip that site. Restart bot after saving.

---

## 10. Edit all settings (.env)

```powershell
notepad .env
```

| Variable | What it controls |
|----------|------------------|
| `USER_NAME`, `USER_EMAIL`, `USER_PHONE`, `USER_LINKEDIN` | Your identity in emails |
| `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD` | Sending mail (App Password only) |
| `TARGET_TITLES` | Job titles to search |
| `PRIMARY_MARKET`, `SECONDARY_MARKETS` | Countries |
| `DAILY_EMAIL_CAP` | Max emails per day |
| `MATCH_THRESHOLD` | Minimum score (0–100) to keep a job |
| `RESUME_PATH` | Path to your PDF CV |

Never share `.env` or commit it to GitHub.

---

## 11. All log files

| File | Contents |
|------|----------|
| `data\jobybot.log` | Main activity (search, emails, errors) |
| `data\scheduler-stdout.log` | Background scheduler output |
| `data\scheduler.log` | Older startup shortcut log (if used) |

### Last 50 lines

```powershell
Get-Content data\jobybot.log -Tail 50
```

### Live tail (updates automatically)

```powershell
Get-Content data\jobybot.log -Tail 30 -Wait
```

### Errors and warnings only

```powershell
Get-Content data\jobybot.log -Tail 200 | Select-String -Pattern "ERROR|WARN|auth|cap|failed" -CaseSensitive:$false
```

### Open in Notepad

```powershell
notepad data\jobybot.log
```

### Clear old log (bot keeps running; optional)

```powershell
Stop-Process -Id (Get-Process python | Where-Object { $_.Path -like "*Jobybot*" }).Id -Force -ErrorAction SilentlyContinue
Start-Sleep 2
"" | Set-Content data\jobybot.log -Encoding UTF8
# Restart bot after
```

---

## 12. Health check & test email

```powershell
& $py jobybot.py doctor
```

```powershell
& $py scripts\test_email.py
```

```powershell
& $py jobybot.py init
```

---

## 13. Backup / reset / update

### Backup to Desktop

```powershell
$backup = "$env:USERPROFILE\Desktop\Jobybot-Backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item ".env" $backup -ErrorAction SilentlyContinue
Copy-Item "data" "$backup\data" -Recurse -ErrorAction SilentlyContinue
Copy-Item "*.pdf" $backup -ErrorAction SilentlyContinue
Write-Host "Backup: $backup"
```

### Reset bot memory (keeps .env)

```powershell
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Jobybot*" } | Stop-Process -Force
$backup = "$env:USERPROFILE\Desktop\Jobybot-PreReset-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
Copy-Item "data" $backup -Recurse -ErrorAction SilentlyContinue
Remove-Item "data" -Recurse -Force -ErrorAction SilentlyContinue
& $py jobybot.py init
```

### Update from GitHub

Double-click **SYNC_GITHUB.bat** or:

```powershell
git pull origin main
& $py -m pip install -r requirements.txt --upgrade
```

---

## 14. Windows auto-start & tasks

### Enable (startup folder + 9 AM safety task)

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\enable_autostart.ps1"
```

Or **JOBYBOT.bat** → option **15**.

### Disable

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\disable_autostart.ps1"
```

Or **JOBYBOT.bat** → option **16**.

---

## 15. Security commands

Run after install and monthly:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\secure_permissions.ps1"
PowerShell -ExecutionPolicy Bypass -File ".\scripts\security_audit.ps1"
```

Or double-click **SECURITY_CHECK.bat**.

Read **docs/SECURITY.md** for what Jobybot does and does not do (no remote access, no open ports).

**Never:**
- Email your `.env` or `resume.pdf` to anyone
- Upload `.env` to cloud drives shared publicly
- Run Jobybot from a copy sent in a random chat — use official GitHub ZIP only

---

## 16. Daily check (one paste)

```powershell
cd "$env:USERPROFILE\Downloads\Jobybot"
$py = ".\.venv\Scripts\python.exe"
Write-Host "`n========== JOBYBOT DAILY CHECK ==========`n" -ForegroundColor Cyan
$proc = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Jobybot*" }
if ($proc) { Write-Host "RUNNING  PID $($proc.Id)  since $($proc.StartTime)" -ForegroundColor Green }
else        { Write-Host "NOT RUNNING — start with RUN_BOT_NOW.bat or jobybot.py schedule" -ForegroundColor Red }
& $py jobybot.py stats
& $py scripts\jobs_by_source.py
Write-Host "`n--- Last log lines ---" -ForegroundColor Cyan
Get-Content data\jobybot.log -Tail 8 -ErrorAction SilentlyContinue
Write-Host "`n=========================================`n" -ForegroundColor Cyan
```

---

## Quick reference card

| I want to… | Command / file |
|------------|----------------|
| Install everything | **SETUP_FOR_FRIENDS.bat** |
| Control panel | **JOBYBOT.bat** |
| Run now | **RUN_BOT_NOW.bat** |
| Stop | Section 2 stop commands |
| Panic stop | Section 3 |
| See jobs | `top_jobs.py` or inbox HTML |
| Change email limit | `notepad .env` → `DAILY_EMAIL_CAP` |
| Change schedule | `notepad .env` → `RUN_INTERVAL_MINUTES` |
| Logs | `Get-Content data\jobybot.log -Tail 30 -Wait` |
| Security | **SECURITY_CHECK.bat** |

🍀 Good luck with your job search.
