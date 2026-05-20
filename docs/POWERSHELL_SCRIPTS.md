# JobyBots — Every script, every flag, every command

Quick reference for the **`.bat`** (Windows), **`.command`** (macOS) and
**`.ps1`** (PowerShell deep-dive) files that ship with JobyBots. Pick the
column for your OS — each row does the same thing.

---

## 1. Quick-access table

| What you want to do | Windows (double-click) | macOS (double-click) | PowerShell one-liner |
|---|---|---|---|
| Open the main menu | `JOBYBOT.bat` | `mac/JobyBot.command` | `powershell -File jobybot-menu.ps1` |
| Install dependencies | `SETUP_FOR_FRIENDS.bat` | `mac/Setup.command` | `pwsh install-friends.ps1` |
| Run one cycle now | `RUN_BOT_NOW.bat` | `mac/RunBotNow.command` | `.venv\Scripts\python.exe jobybot.py run` |
| Open dashboard in browser | `DASHBOARD.bat` | `mac/Dashboard.command` | `.venv\Scripts\python.exe scripts\open_dashboard.py` |
| Start every-30-min auto schedule | `START_AUTOSCHEDULE.bat` | `mac/StartAutoSchedule.command` | `pwsh powershell\15-Start-Background.ps1` |
| Stop the bot | menu → option 4 | `mac/StopBot.command` | `pwsh powershell\13-Stop-Bot.ps1` |
| Emergency shut-down everything | menu → option 9 | `mac/StopBot.command` | `pwsh powershell\14-Emergency-Shutdown.ps1` |
| Live cycle status (DB query) | `python scripts\cycle_status.py` | `python scripts/cycle_status.py` | same |
| Check for bounces | `CHECK_BOUNCES.bat` | `python scripts/check_bounces.py` | `pwsh powershell\09-Doctor.ps1` |
| Verify file permissions | `SECURITY_CHECK.bat` | `chmod -R 600 .env *.pdf` | same |
| Send test email to yourself | menu → option 10 | `python scripts/test_email.py` | `pwsh powershell\10-Test-Email.ps1` |
| Edit your `.env` | menu → option 5 | `open -e .env` | `pwsh powershell\20-Edit-Env.ps1` |
| Tail the live log | menu → option 11 | `tail -f data/jobybot.log` | `pwsh powershell\11-Tail-Log.ps1` |
| List jobs found today | menu → option 7 | `python scripts/jobs_today.py` | `pwsh powershell\07-Jobs-Today.ps1` |
| Top jobs by AI score | menu → option 3 | `python scripts/top_jobs.py` | `pwsh powershell\03-Top-Jobs.ps1` |
| Recent emails sent | menu → option 4 | `python scripts/recent_emails.py` | `pwsh powershell\04-Recent-Emails.ps1` |
| Build customer .zip | `BUILD_CUSTOMER_PACKAGE.bat` | `python scripts/build_customer_package.py --zip` | same |
| Re-run setup | menu → option 6 | `mac/Setup.command` | `pwsh install-friends.ps1` |

---

## 2. Every Windows `.bat` file explained

### `JOBYBOT.bat` — main menu
Opens `jobybot-menu.ps1`, an interactive PowerShell menu with 11 options.
This is the file you give to non-technical customers. Everything else is
reachable from here.

### `RUN_BOT_NOW.bat`
```bat
.venv\Scripts\python.exe jobybot.py run
```
Runs **one full cycle**: search → score → tailor → send → bounce-scan.
Takes 15-30 min depending on `DAILY_EMAIL_CAP`. Window stays open.

### `DASHBOARD.bat`
```bat
.venv\Scripts\python.exe scripts\open_dashboard.py
```
Starts the local web server on `http://localhost:8080` and opens your
default browser. Server keeps running until you close the terminal.

### `START_AUTOSCHEDULE.bat`
Stops any existing scheduled task, registers a new one called
`JobybotHourly` that runs `_run_scheduler.bat` every
`RUN_INTERVAL_MINUTES` (default 30), then starts it immediately and
prints status + stats.

### `SETUP_FOR_FRIENDS.bat`
Wraps `install-friends.ps1` — the script that:
1. Sets PowerShell ExecutionPolicy for the current user
2. Finds Python 3.10+
3. Creates `.venv`
4. Installs from `python-deps.txt`
5. Copies `.env.example` → `.env` if needed and opens it for editing
6. Verifies `resume.pdf` exists
7. Tightens file ACLs on `.env` and `*.pdf`
8. Runs `jobybot.py init` (health check + Gmail test)

### `CHECK_BOUNCES.bat`
```bat
.venv\Scripts\python.exe scripts\check_bounces.py
```
Reads your Gmail IMAP inbox for Mailer-Daemon NDRs, parses bounce codes,
and writes invalid addresses to `invalid_emails` table so they're never
emailed again.

### `SECURITY_CHECK.bat`
Hardens filesystem permissions:
- `.env` and `*.pdf` → owner-only (`icacls /inheritance:r /grant:r %username%:F`)
- `data/` → owner-only recursive
- Verifies `.gitignore` covers `.env`, `data/`, `*.pdf`

### `OPEN_WEBSITE.bat`
Launches `https://jobybots.com/dashboard` in your default browser —
useful when you want the marketing preview.

### `SYNC_GITHUB.bat`
For the project owner only. Runs `git pull origin main`, `git push origin
main` after stashing local changes.

### `TEST_ALL_COMMANDS.bat`
Loops through every `powershell\NN-*.ps1` script and reports OK / FAIL
status. Use after a system update to confirm nothing broke.

### `BUILD_CUSTOMER_PACKAGE.bat`  *(new)*
Runs `scripts\build_customer_package.py --zip`. Output:
- `customer-package\JobyBots\` (~280 KB folder)
- `customer-package\JobyBots.zip` (single-file delivery to email customers)

### `_run_scheduler.bat` *(internal)*
Tiny wrapper called by Windows Task Scheduler. Not for manual use.

---

## 3. Every macOS `.command` file explained

### `mac/JobyBot.command` — main menu
Mirrors `JOBYBOT.bat`. Same 7 options. Self-loops until you press `q`.

### `mac/Setup.command`
The macOS equivalent of `SETUP_FOR_FRIENDS.bat`. Detects Python via
Homebrew or python.org, creates `.venv`, installs deps, opens `.env` in
TextEdit, chmods secrets to 600, runs `jobybot.py init`.

### `mac/RunBotNow.command`
One full cycle. Stays in foreground so you can watch.

### `mac/Dashboard.command`
Opens `http://localhost:8080` via the venv's Python.

### `mac/StartAutoSchedule.command`
Reads `RUN_INTERVAL_MINUTES` from `.env`, generates a launchd plist at
`~/Library/LaunchAgents/com.jobybots.scheduler.plist`, and loads it.
Bot runs every 30 minutes even after logout.

### `mac/StopBot.command`
`launchctl unload` + removes plist + `pgrep | xargs kill -9` any
straggler `jobybot.py` processes.

---

## 4. The `powershell\` library — for when you want surgical control

23 small `.ps1` scripts you can call individually. Each is numbered so
beginners pick them in order, advanced users skip to whichever they want.

| Script | What it prints / does |
|---|---|
| `01-Is-Running.ps1` | Is the scheduled task currently running? |
| `02-Stats.ps1` | Quick stats: jobs today, emails today, total in DB |
| `03-Top-Jobs.ps1` | Top 20 jobs by AI score |
| `04-Recent-Emails.ps1` | Last 20 emails sent |
| `05-Jobs-By-Source.ps1` | Count of jobs per source (LinkedIn vs Indeed vs …) |
| `06-List-All-Jobs.ps1` | Full dump of today's jobs |
| `07-Jobs-Today.ps1` | Today-only listing |
| `08-LinkedIn-Jobs.ps1` | Filter to LinkedIn results |
| `08-Indeed-Jobs.ps1` | Filter to Indeed results |
| `08-Bayt-Jobs.ps1` | Filter to Bayt results |
| `09-Doctor.ps1` | Full health check — checks DB, Gmail, Gemini, sources |
| `10-Test-Email.ps1` | Sends a test email to yourself to confirm SMTP |
| `11-Tail-Log.ps1` | Live tail of `data/jobybot.log` |
| `12-Open-Inbox.ps1` | Opens `data/click_apply_inbox.html` |
| `13-Stop-Bot.ps1` | Stop the scheduler (graceful) |
| `14-Emergency-Shutdown.ps1` | Stop + kill everything (force) |
| `15-Start-Background.ps1` | Start the scheduler as a background task |
| `16-Daily-Check.ps1` | One-pass health audit you can put in cron |
| `17-Run-One-Cycle.ps1` | Identical to `RUN_BOT_NOW.bat` but PowerShell-native |
| `18-Search-Only.ps1` | Run only the search phase, skip emails |
| `19-Email-Only.ps1` | Run only email blast on already-scored jobs |
| `20-Edit-Env.ps1` | Open `.env` in your default editor |

### Examples

```powershell
# How many jobs did the bot find today across each source?
pwsh powershell\05-Jobs-By-Source.ps1

# Stop the scheduler but DON'T kill the current cycle (let it finish)
pwsh powershell\13-Stop-Bot.ps1

# Watch logs live (CTRL+C to stop)
pwsh powershell\11-Tail-Log.ps1

# Do search-only — no emails will go out (good for testing)
pwsh powershell\18-Search-Only.ps1
```

---

## 5. Changing the run interval

By default JobyBots runs **every 30 minutes**. To change, edit `.env`:

```ini
RUN_INTERVAL_MINUTES=15   # every 15 min (more recent jobs)
RUN_INTERVAL_MINUTES=60   # every hour  (lower CPU)
```

Then re-run the auto-schedule script:

```powershell
# Windows
.\START_AUTOSCHEDULE.bat
```

```bash
# macOS
./mac/StartAutoSchedule.command
```

It will replace the existing task with the new interval.

> Going below 10 minutes is **not recommended** — you'll hit Gemini and
> source-site rate limits before you find more jobs.

---

## 6. Turning specific sources on / off

Edit `.env`:

```ini
ENABLE_LINKEDIN_SEARCH=true
ENABLE_INDEED=true
ENABLE_NAUKRIGULF=true
ENABLE_BAYT=true
ENABLE_GULFTALENT=true
ENABLE_REMOTEOK=true
ENABLE_COMPANY_CAREERS=true   # Greenhouse + Lever + Workable + Ashby (40+ companies)
```

Set any to `false` to disable that source on the next cycle. No restart
needed — the bot reads `.env` fresh at every `jobybot.py run`.

---

## 7. Emergency cheat sheet (print this)

```
Bot misbehaving?       →  JOBYBOT.bat → option 4 (Stop)
Gmail flagged spam?    →  Lower DAILY_EMAIL_CAP=50 in .env, restart
Recruiter complains?   →  Email the bot's address, add to FOLLOWUP_BLACKLIST
DB corrupted?          →  Delete data/jobybot.db, run JOBYBOT.bat → 1 then 2
Forgot what's running? →  pwsh powershell\01-Is-Running.ps1
Total reset?           →  pwsh powershell\14-Emergency-Shutdown.ps1
                          rm -rf .venv data/  → start over
Founder's WhatsApp     →  +91 7989931325
                       →  Email: tharakesh.iitp@gmail.com
```

That's everything. If a script you need isn't on this page, it doesn't
exist yet — email us and we'll add it.
