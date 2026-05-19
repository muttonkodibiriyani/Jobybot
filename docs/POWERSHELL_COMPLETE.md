# Jobybot — PowerShell Commands (FIXED — tested pattern)

**Problem with old snippets:** `$py` was undefined, `python -c @"..."@` breaks on Windows, and `Start-Process` needs **full paths**.

**Fix:** Use scripts in the `powershell\` folder — each one works on its own.

---

## Step 0 — Run this once per PowerShell window

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
```

Change the path if your folder is not in Downloads.

---

## Test everything automatically

Double-click **`TEST_ALL_COMMANDS.bat`**  
Or:

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
PowerShell -NoProfile -ExecutionPolicy Bypass -File ".\TEST_ALL_COMMANDS.ps1"
```

---

## All commands (copy one line at a time)

Replace the folder path if yours is different.

### 1. Is the bot running?

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\01-Is-Running.ps1"
```

### 2. Statistics (jobs / emails today / cap)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\02-Stats.ps1"
```

### 3. Top 20 jobs

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\03-Top-Jobs.ps1"
```

### 4. Last 20 emails sent

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\04-Recent-Emails.ps1"
```

### 5. Jobs count per website (LinkedIn, Indeed, Bayt…)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\05-Jobs-By-Source.ps1"
```

### 6. List all jobs in database

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\06-List-All-Jobs.ps1"
```

### 7. Jobs added today

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\07-Jobs-Today.ps1"
```

### 8. LinkedIn jobs only

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\08-LinkedIn-Jobs.ps1"
```

Indeed / Bayt / NaukriGulf / RemoteOK — edit `08-LinkedIn-Jobs.ps1` last line to pass another name, or:

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
.\.venv\Scripts\python.exe scripts\jobs_by_source_name.py Indeed
```

### 9. Health check

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\09-Doctor.ps1"
```

### 10. Send test email to yourself

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\10-Test-Email.ps1"
```

### 11. Live log (Ctrl+C to stop watching)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\11-Tail-Log.ps1"
```

### 12. Open job inbox in browser

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\12-Open-Inbox.ps1"
```

### 13. Stop bot

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\13-Stop-Bot.ps1"
```

### 14. Emergency shutdown (stop + remove auto-start)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\14-Emergency-Shutdown.ps1"
```

### 15. Start bot in background (hourly schedule)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\15-Start-Background.ps1"
```

### 16. Daily check (status + stats + log)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\16-Daily-Check.ps1"
```

### 17. Run one full cycle (search + email — 15–30 min)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\17-Run-One-Cycle.ps1"
```

Or double-click **`RUN_BOT_NOW.bat`**.

### 18. Search jobs only

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\18-Search-Only.ps1"
```

### 19. Send emails only

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\19-Email-Only.ps1"
```

### 20. Edit settings (.env)

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\20-Edit-Env.ps1"
```

Change email limit: set `DAILY_EMAIL_CAP=200`  
Change schedule: set `RUN_INTERVAL_MINUTES=60`  
Toggle LinkedIn / Indeed / Bayt:

```env
ENABLE_LINKEDIN_SEARCH=true
ENABLE_INDEED=true
ENABLE_BAYT=true
ENABLE_NAUKRIGULF=true
ENABLE_REMOTEOK=true
```

---

## Shorter commands (if you are already in the Jobybot folder)

After `cd` to Jobybot:

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
. .\powershell\Jobybot-Init.ps1

Invoke-Jobybot -Args @("stats")
Invoke-Jobybot -Args @("run")
Invoke-Jobybot -Args @("search")
Invoke-Jobybot -Args @("email")
Invoke-Jobybot -Args @("doctor")
Invoke-JobybotScript "top_jobs.py"
Invoke-JobybotScript "recent_emails.py"
Invoke-JobybotScript "jobs_by_source.py"
Invoke-JobybotScript "emails_by_company.py" "Deloitte"
Stop-JobybotProcess
Start-JobybotSchedulerBackground
```

---

## Logs (plain PowerShell — no script file needed)

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
Get-Content .\data\jobybot.log -Tail 50
Get-Content .\data\jobybot.log -Tail 30 -Wait
Get-Content .\data\jobybot.log -Tail 200 | Select-String "ERROR|WARN|cap|auth"
notepad .\data\jobybot.log
Get-Content .\data\scheduler-stdout.log -Tail 30 -ErrorAction SilentlyContinue
```

---

## Auto-start / security

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
PowerShell -ExecutionPolicy Bypass -File .\scripts\enable_autostart.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\disable_autostart.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\secure_permissions.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\security_audit.ps1
```

Or double-click **SECURITY_CHECK.bat**.

---

## Backup

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
$backup = "$env:USERPROFILE\Desktop\Jobybot-Backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item ".env" $backup -ErrorAction SilentlyContinue
Copy-Item "data" "$backup\data" -Recurse -ErrorAction SilentlyContinue
Copy-Item "*.pdf" $backup -ErrorAction SilentlyContinue
Write-Host "Backup: $backup"
```

---

## Quick map

| Goal | File to run |
|------|-------------|
| Test all safe commands | `TEST_ALL_COMMANDS.bat` |
| Menu | `JOBYBOT.bat` |
| Run now | `RUN_BOT_NOW.bat` |
| Full command list | this file |
| Friend install | `SETUP_FOR_FRIENDS.bat` |
