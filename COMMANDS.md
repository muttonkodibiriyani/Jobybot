# Jobybot — PowerShell Cheat Sheet

Every command below is meant to be run from PowerShell **inside the
Jobybot folder**. The single most common error ("`jobybot` is not
recognized") is fixed by either typing the full path or activating the
virtual environment first.

---

## 0. Open PowerShell in the right folder

```powershell
cd C:\Users\tharakeswara.reddy\Downloads\Jobybot
```

(Tab-completion works — type `cd C:\Users\thar` then press Tab.)

You can confirm you're in the right place by running:

```powershell
dir jobybot.py
```

If you see the file listed, you're in the right place.

---

## 1. Activate the virtual environment ONCE per terminal session

```powershell
.\.venv\Scripts\Activate.ps1
```

After this, your prompt will show `(.venv)` at the front and you can
use the short form `python jobybot.py <command>` throughout the
session.

> If PowerShell blocks the script with an "execution policy" error,
> run this once and try again:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

If you don't want to activate, use the **full path** every time:

```powershell
.\.venv\Scripts\python.exe jobybot.py <command>
```

---

## 2. The everyday commands

### See where every job stands (the funnel)
```powershell
python jobybot.py funnel
```
Tells you how many jobs are pending discovery, queued for review,
sent, parked, etc. This is the FIRST command to run when you think
"nothing is happening".

### Quick health check
```powershell
python jobybot.py status
```
Reports whether the scheduler is alive, how many emails went out
today, queue depth, and time of last activity.

### Configuration / dependency check
```powershell
python jobybot.py doctor
```
Tells you if Gemini API key, Gmail app password, LinkedIn cookie,
and other prerequisites are set up correctly.

---

## 3. Run the bot manually

### One full cycle (search → discover → queue/send → follow-ups)
```powershell
python jobybot.py run
```
This is what the scheduler triggers every cycle. Run it manually
to see what happens, end-to-end.

### Just search for new jobs (no email)
```powershell
python jobybot.py search
```

### Just send curated-market emails (no search)
```powershell
python jobybot.py email
```

### Start the background scheduler (24/7 daemon)
```powershell
python jobybot.py schedule
```
Or double-click `START_AUTOSCHEDULE.bat`.

### Idempotent daily check (restarts scheduler if dead + runs cycle)
```powershell
python jobybot.py heartbeat
```

---

## 4. Review and one-click send queue

### Open the review queue web UI
```powershell
python jobybot.py queue
```
Or double-click `REVIEW_QUEUE.bat`. Opens
http://127.0.0.1:7868 in your browser where you click Send / Skip
on each queued email.

### Toggle live-send vs draft-mode (review-first)
```powershell
python jobybot.py live-mode --on    # send straight from cycle (no queue)
python jobybot.py live-mode --off   # everything goes to queue (default)
```

---

## 5. LinkedIn Easy Apply

### Refresh your LinkedIn session cookie (needed every ~7-14 days)
```powershell
python jobybot.py login-linkedin
```
Opens a real Chrome window. Log in manually, close the window —
your full session is saved for future Easy Apply and recruiter
lookups. **Run this when the funnel says "circuit-broken after 3
LinkedIn failures".**

### Run Easy Apply (dry-run by default)
```powershell
python jobybot.py easy-apply
```
With `--no-dry-run` it will actually submit applications. Default
caps at the value of `EASY_APPLY_DAILY_CAP` in `.env`.

---

## 6. Unblock / unstick a job

### Reset ALL parked jobs (after fixing LinkedIn cookie etc.)
```powershell
python jobybot.py retry-job
```

### Reset a single job by id
```powershell
python jobybot.py retry-job linkedin_4419803356
```
You get job IDs from the funnel output or the dashboard.

---

## 7. Email deliverability

### Check Gmail for bounces and quarantine bad addresses
```powershell
python jobybot.py bounces
python jobybot.py bounces --backfill --days 30
```
Or double-click `CHECK_BOUNCES.bat`.

### Re-touch recruiters faster (default 7 days)
```powershell
python jobybot.py relax-followups --days 3
```

---

## 8. Stats

```powershell
python jobybot.py stats
```

---

## 9. Dashboard

```powershell
python jobybot.py run        # any cycle re-renders the dashboard
```
Then open `data\dashboard.html` in your browser, or double-click
`DASHBOARD.bat`.

---

## Double-clickable shortcuts (no PowerShell needed)

If you don't want to use PowerShell at all, these `.bat` files
double-click straight from File Explorer:

| File | What it does |
|---|---|
| `JOBYBOT.bat` | Opens an interactive menu |
| `RUN_BOT_NOW.bat` | Runs one full cycle |
| `START_AUTOSCHEDULE.bat` | Starts the background scheduler |
| `DASHBOARD.bat` | Opens the dashboard HTML |
| `REVIEW_QUEUE.bat` | Opens the review queue UI |
| `CHECK_BOUNCES.bat` | Scans Gmail for bounces |
| `EASY_APPLY.bat` | Runs LinkedIn Easy Apply |
| `SEND_TEST_10.bat` | Sends 10 test emails |
| `TEST_ALL_COMMANDS.bat` | Smoke-tests every command |
| `SYNC_GITHUB.bat` | Pulls latest version from GitHub |

---

## Troubleshooting

### "jobybot is not recognized"
→ You forgot to type `python` in front. Use `python jobybot.py funnel`
not `jobybot funnel`.

### "Cannot find path 'jobybots'"
→ The folder is `Jobybot` (no s). Use `cd Jobybot` or
`cd Downloads\Jobybot`.

### "ModuleNotFoundError"
→ The venv isn't activated. Either run `.\.venv\Scripts\Activate.ps1`
or use the full path `.\.venv\Scripts\python.exe jobybot.py ...`.

### "running scripts is disabled on this system"
→ One-time fix:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Nothing happens when I run the bot
→ Run `python jobybot.py funnel` to see exactly where in the pipeline
jobs are stuck. Then `python jobybot.py doctor` to verify the
config.
