# Customer terminal walkthrough — validate the bot end-to-end in 15 minutes

> **Hi customer.** This is a copy-paste session that proves JobyBots is
> working on your machine. Every line below is a single command — open a
> terminal in the JobyBots folder and follow along.

---

## Open a terminal in the JobyBots folder

### Windows
1. Open the `JobyBots` folder in File Explorer.
2. Click the address bar at the top, type `powershell`, press **Enter**.

A blue PowerShell window opens, already in the right folder.

### macOS
1. Open the `JobyBots` folder in Finder.
2. Right-click an empty area → **Services → New Terminal at Folder**.
   (If you don't see this option: System Settings → Keyboard → Keyboard
   Shortcuts → Services → check "New Terminal at Folder".)

---

## Step 1 — Confirm everything is installed

### Windows
```powershell
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -c "import config; print('Config OK')"
```

### macOS
```bash
./.venv/bin/python --version
./.venv/bin/python -c "import config; print('Config OK')"
```

You should see something like:
```
Python 3.12.7
Config OK
```

✅ Means Python is installed and your `.env` is being read.

---

## Step 2 — Verify your résumé was parsed

### Windows
```powershell
.\.venv\Scripts\python.exe -c "from core.resume_parser import parse_resume; from config import get_settings; p = parse_resume(get_settings().resume_path); print('Skills:', len(p.skills), p.skills[:5]); print('Years:', p.years_experience); print('Titles:', p.titles[:5])"
```

### macOS
```bash
./.venv/bin/python -c "from core.resume_parser import parse_resume; from config import get_settings; p = parse_resume(get_settings().resume_path); print('Skills:', len(p.skills), p.skills[:5]); print('Years:', p.years_experience); print('Titles:', p.titles[:5])"
```

Expected:
```
Skills: 27 ['python', 'sql', 'aws', 'product management', 'sql']
Years: 7
Titles: ['product manager', 'business analyst', 'data engineer', ...]
```

✅ Means JobyBots can read your résumé and knows who you are.

---

## Step 3 — Test Gmail SMTP (sends a test email to yourself)

### Windows
```powershell
.\.venv\Scripts\python.exe jobybot.py init
```

### macOS
```bash
./.venv/bin/python jobybot.py init
```

Expected:
```
INFO    | 🚀 Jobybot init
INFO    | Parsing resume: resume.pdf
SUCCESS | Profile built: 27 skills, 7 yrs
INFO    | Testing Gmail SMTP...
SUCCESS | Gmail SMTP login OK ✓
SUCCESS | ✓ Init complete.
```

✅ Means Gmail accepts your App Password.

---

## Step 4 — Test Gemini AI (sends one test call)

### Windows
```powershell
$env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe scripts\test_gemini.py
```

### macOS
```bash
PYTHONIOENCODING=utf-8 ./.venv/bin/python scripts/test_gemini.py
```

Expected:
```
Gemini score: 92/100
Reason: Strong match — your résumé highlights mobility + payments…

Tailored email preview:
Hi [Recruiter],
I noticed your "Senior PM, Mobility" role at Careem. Your team's recent…
```

✅ Means the AI is wired up and can score + tailor.

---

## Step 5 — Run a full cycle (search → score → send)

This is the real thing. **It will send real emails** if `DAILY_EMAIL_CAP > 0`.

### Windows (full output)
```powershell
.\RUN_BOT_NOW.bat
```

### macOS (full output)
```bash
./mac/RunBotNow.command
```

You'll see, in real-time:

```
14:02:34 | INFO    | CYCLE START
14:02:36 | INFO    | Bounce scan: checking 195 NDR messages…
14:03:59 | INFO    | Search plan: 540 (source × title × location) calls
14:03:59 | INFO    |   + [70] Senior Product Manager @ Klook (LinkedIn, Singapore)
14:04:01 | INFO    |   + [88] Data Product Manager @ talabat (Indeed, Riyadh)
14:04:02 | INFO    |   + [92] Senior PM, Mobility @ Careem (LinkedIn, Dubai)
14:04:05 | INFO    |   + [65] Senior Specialist - Power BI Developer @ Deeplight AI (LinkedIn, UAE)
…
14:04:53 | SUCCESS | Search complete: 41 new jobs added
14:04:53 | INFO    | [UAE] 79 contacts — starting blast
14:05:24 | SUCCESS | Email sent → senior-recruiter@careem.com  (Senior PM)
14:06:18 | SUCCESS | Email sent → careers@talabat.com  (Data PM)
…
14:32:11 | SUCCESS | Cycle complete: 41 found, 18 emails sent, 0 bounces
```

You can close the window any time — the cycle keeps running in the
background until it's done.

### What's happening behind the scenes

1. **30 seconds:** read résumé, build profile
2. **2 minutes:** scan all 7 sources × 8 titles × 12 locations in parallel
3. **1 minute:** Gemini scores each new job
4. **15–30 minutes:** email blast with 30–120 s jitter between sends
5. **30 seconds:** scan inbox for bounces, store, exit

---

## Step 6 — Watch live progress while the cycle runs

Open a **second** terminal window (same way as Step 0) and run:

### Windows
```powershell
.\.venv\Scripts\python.exe scripts\cycle_status.py
```

### macOS
```bash
./.venv/bin/python scripts/cycle_status.py
```

You'll see live counters tick up:
```
  Jobs in DB total:        628 → 669
  Jobs added today:        14  → 41 → 55
  Emails sent total:       295 → 297 → 312
  Emails sent today:       0   → 2  → 17
```

Run the command again every 30 seconds to see the numbers climb. **This
is the live dashboard reading directly from the SQLite database.**

---

## Step 7 — Open the visual dashboard

In your **second** terminal:

### Windows
```powershell
.\DASHBOARD.bat
```

### macOS
```bash
./mac/Dashboard.command
```

Your default browser opens `http://localhost:8080`. You'll see:

- KPI tiles (Matched / Sent today / Bounces / Sources)
- Live activity log (auto-refresh every 1.8 s)
- Ranked job list with Apply buttons
- Bounce list (empty if everything's clean)

Keep this tab open while you work — it's your control panel.

---

## Step 8 — Check the daily HTML inbox

After the cycle has run at least once:

### Windows
```powershell
start data\click_apply_inbox.html
```

### macOS
```bash
open data/click_apply_inbox.html
```

This is your "open & apply" tab — every job in your pipeline with:
- Match score chips (color-coded)
- Direct apply links to LinkedIn Easy Apply / Indeed / etc.
- Status (queued → emailed → replied → archived)

The fastest way to apply to 20 jobs in 10 minutes on a coffee break.

---

## Step 9 — Inspect what was sent today

### Windows
```powershell
.\.venv\Scripts\python.exe scripts\recent_emails.py
```

### macOS
```bash
./.venv/bin/python scripts/recent_emails.py
```

Output:
```
2026-05-20 14:05:24  → senior-recruiter@careem.com  Senior PM, Mobility
2026-05-20 14:06:18  → careers@talabat.com          Data Product Manager
2026-05-20 14:07:45  → hr@razorpay.com              AI Product Lead
…
```

✅ These are the real emails JobyBots just sent from your Gmail account.
Check your **Sent** folder in Gmail to confirm.

---

## Step 10 — Schedule it to run every 30 minutes forever

### Windows
```powershell
.\START_AUTOSCHEDULE.bat
```

### macOS
```bash
./mac/StartAutoSchedule.command
```

From this moment, every 30 minutes (configurable in `.env`), JobyBots
will silently:
- Search 8 sources
- Score new jobs with Gemini
- Send up to your daily-cap emails
- Update the dashboard
- Log everything to `data/jobybot.log`

Even if you log out or reboot. The schedule survives until you stop it.

### To verify the scheduler is running
```powershell
# Windows
schtasks /Query /TN "JobybotHourly" /V /FO LIST | findstr "Status"
```

```bash
# macOS
launchctl list | grep jobybots
```

You should see `Running` (Win) or `0` exit-status (mac).

### To stop the scheduler
- Windows: `JOBYBOT.bat` → option 4
- macOS: `mac/StopBot.command`

---

## Step 11 — Live tail the log while it runs in the background

### Windows
```powershell
Get-Content data\jobybot.log -Wait -Tail 20
```

### macOS
```bash
tail -f data/jobybot.log
```

This streams every event the bot does in real time. Press **Ctrl+C** to
stop watching (the bot keeps running).

---

## Step 12 — End-of-day report

At the end of the day, run:

### Windows
```powershell
.\.venv\Scripts\python.exe scripts\cycle_status.py
```

### macOS
```bash
./.venv/bin/python scripts/cycle_status.py
```

A typical good day looks like:
```
  Jobs in DB total:        1,247
  Jobs added today:        134
  Emails sent total:       1,580
  Emails sent today:       189 / 200
  Bad/bounced emails:      3
  Cached recruiter emails: 286

  Top 10 jobs scraped today (by AI score):
    [92]  Senior PM, Mobility            Careem        LinkedIn/Dubai
    [88]  Data PM                        talabat       Indeed/Riyadh
    [85]  AI Product Lead                Razorpay      Naukri/Bengaluru
    …
```

That's **189 personalised emails sent on autopilot** while you did anything
else with your day.

---

## You're done — what now?

- ✅ Open Gmail → **Sent** folder → confirm the emails are personalised
  per company.
- ✅ Open Gmail → **Inbox** → over the next 24-72h you'll see replies.
- ✅ Tomorrow morning at 9 AM, check your inbox for the **daily digest** —
  top 25 AI-matched jobs of the last 24 hours with one-click apply.
- ✅ When recruiters reply, that's your interview cue. Reply from Gmail
  as usual — JobyBots doesn't intercept replies.

> **Pro tip:** Most people get their first interview within 5–7 days.
> Some within 24 hours. Be ready for screening calls — set up a calendly
> link and put it in your `USER_SUMMARY` for the bot to include.

If anything in this walkthrough didn't behave as described above, that's
**our bug, not yours.** Email **tharakesh.iitp@gmail.com** with a copy
of the terminal output and we'll fix it within 24 hours.

— *The JobyBots team*
