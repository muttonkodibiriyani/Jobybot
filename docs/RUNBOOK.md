# Jobybot Runbook — Start to Stop (Your PC)

**Your folder:** `C:\Users\tharakeswara.reddy\Downloads\Jobybot`

---

## Why emails stopped earlier today

Your log showed: `Daily cap (80) already reached`. You already sent **80 emails today** when the limit was still 80.  
Your `.env` now has **`DAILY_EMAIL_CAP=200`**, so you can send **up to 120 more today** — but only to contacts **not already emailed** (the bot never emails the same person twice).

**Applying to jobs:** Jobybot does **not** auto-click LinkedIn Easy Apply. It emails recruiters and builds:

`data\click_apply_inbox.html` → open in browser → click **Open & Apply** yourself.

---

## Change schedule: 1 hour → 30 minutes

1. Open `.env` and change:

```env
RUN_INTERVAL_MINUTES=30
```

2. Restart the bot (commands in section **Restart** below).

**Example:** every 30 minutes = search new jobs + try email blast + update inbox.

---

## NEW LAPTOP — full install

### Example (what you type and what you should see)

```powershell
PS C:\Users\tharakeswara.reddy> cd "$env:USERPROFILE\Downloads\Jobybot"
PS C:\Users\tharakeswara.reddy\Downloads\Jobybot>
```

Download Jobybot from https://github.com/muttonkodibiriyani/Jobybot (ZIP), extract, add `resume.pdf`, then:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
PowerShell -ExecutionPolicy Bypass -File .\install.ps1
```

Or double-click **`SETUP_FOR_FRIENDS.bat`** (same thing, more guided).

Fill `.env` when Notepad opens (Gmail App Password from https://myaccount.google.com/apppasswords).

---

## START — run now + auto-schedule every hour

### Option A — double-click (easiest)

1. **`START_AUTOSCHEDULE.bat`** — background bot + auto-start on login  
2. **`RUN_BOT_NOW.bat`** — one immediate search + email cycle (15–30 min)

### Option B — PowerShell (with example output)

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
. .\powershell\Jobybot-Init.ps1
Start-JobybotSchedulerBackground
```

**Expected:**

```text
Scheduler started in background.
```

Enable auto-start on login:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\enable_autostart.ps1
```

**Expected:**

```text
[OK] Startup shortcut: ...
[OK] Daily 9:00 task: JobybotDaily
```

---

## VIEW — is it running? stats? jobs? emails?

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
PowerShell -ExecutionPolicy Bypass -File .\powershell\01-Is-Running.ps1
```

**Expected if running:**

```text
RUNNING  PID 12345
  "C:\...\python.exe" "C:\...\jobybot.py" schedule
```

**Expected if not:**

```text
NOT RUNNING
```

```powershell
PowerShell -ExecutionPolicy Bypass -File .\powershell\02-Stats.ps1
```

**Example output:**

```text
  Jobs found     : 519
  Emails sent    : 240
  Emails today   : 80/200
```

```powershell
PowerShell -ExecutionPolicy Bypass -File .\powershell\04-Recent-Emails.ps1
PowerShell -ExecutionPolicy Bypass -File .\powershell\03-Top-Jobs.ps1
PowerShell -ExecutionPolicy Bypass -File .\powershell\12-Open-Inbox.ps1
```

Live log:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\powershell\11-Tail-Log.ps1
```

---

## SEND EMAILS NOW (if cap not reached)

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
PowerShell -ExecutionPolicy Bypass -File .\powershell\19-Email-Only.ps1
```

Or full cycle (search + email):

```powershell
PowerShell -ExecutionPolicy Bypass -File .\powershell\17-Run-One-Cycle.ps1
```

Test Gmail:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\powershell\10-Test-Email.ps1
```

**Expected:** email arrives at your inbox within 30 seconds.

---

## PAUSE / STOP

Jobybot has no “pause” button. **Stop** = bot stops until you start again.

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
PowerShell -ExecutionPolicy Bypass -File .\powershell\13-Stop-Bot.ps1
```

**Expected:**

```text
Stopped PID 12345
```

---

## EMERGENCY STOP (stop + no auto-restart on reboot)

```powershell
PowerShell -ExecutionPolicy Bypass -File "C:\Users\tharakeswara.reddy\Downloads\Jobybot\powershell\14-Emergency-Shutdown.ps1"
```

Or **JOBYBOT.bat** → option **4** → type `YES`.

---

## RESTART (after changing .env or interval)

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
. .\powershell\Jobybot-Init.ps1
Stop-JobybotProcess
Start-Sleep -Seconds 3
Start-JobybotSchedulerBackground
```

---

## All scenarios — one-line commands

| Scenario | Command |
|----------|---------|
| Install new laptop | `SETUP_FOR_FRIENDS.bat` |
| Start auto-schedule | `START_AUTOSCHEDULE.bat` |
| Run once now | `RUN_BOT_NOW.bat` |
| Is running? | `powershell\01-Is-Running.ps1` |
| Stats | `powershell\02-Stats.ps1` |
| Top jobs | `powershell\03-Top-Jobs.ps1` |
| Recent emails | `powershell\04-Recent-Emails.ps1` |
| Jobs by site | `powershell\05-Jobs-By-Source.ps1` |
| Open apply inbox | `powershell\12-Open-Inbox.ps1` |
| Search only | `powershell\18-Search-Only.ps1` |
| Email only | `powershell\19-Email-Only.ps1` |
| Stop (pause) | `powershell\13-Stop-Bot.ps1` |
| Emergency stop | `powershell\14-Emergency-Shutdown.ps1` |
| Edit settings / 30 min | `powershell\20-Edit-Env.ps1` |
| Test all scripts | `TEST_ALL_COMMANDS.bat` |
| Security lock | `SECURITY_CHECK.bat` |

Full paths: see **`docs/POWERSHELL_COMPLETE.md`**.

---

## 30-minute schedule — copy-paste

```powershell
cd "C:\Users\tharakeswara.reddy\Downloads\Jobybot"
notepad .env
```

Set `RUN_INTERVAL_MINUTES=30`, save, then:

```powershell
. .\powershell\Jobybot-Init.ps1
Stop-JobybotProcess
Start-Sleep -Seconds 3
Start-JobybotSchedulerBackground
Invoke-Jobybot -Args @("stats")
```
