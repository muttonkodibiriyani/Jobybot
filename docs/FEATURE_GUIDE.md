# JobyBots — Feature guide (customer edition)

Welcome. This is the friendly tour of **everything you can do** with
JobyBots after install. If something here doesn't work, it's our bug —
email **tharakesh.iitp@gmail.com** and we'll fix it.

---

## Table of contents

1. [Search 8 sources every 30 minutes](#1-search-8-sources-every-30-minutes)
2. [AI-powered résumé scoring (Gemini)](#2-ai-powered-rsum-scoring-gemini)
3. [Tailored cover letters per job](#3-tailored-cover-letters-per-job)
4. [Validated recruiter emails (no bounces)](#4-validated-recruiter-emails-no-bounces)
5. [200 personalized emails per day](#5-200-personalized-emails-per-day)
6. [GDPR-safe mode for EU markets](#6-gdpr-safe-mode-for-eu-markets)
7. [Daily 9 AM digest email](#7-daily-9-am-digest-email)
8. [Click & Apply HTML inbox](#8-click--apply-html-inbox)
9. [Live local dashboard](#9-live-local-dashboard)
10. [Multi-market job hunting](#10-multi-market-job-hunting)
11. [Bounce tracking + automatic blacklist](#11-bounce-tracking--automatic-blacklist)
12. [Auto-schedule (set & forget)](#12-auto-schedule-set--forget)
13. [Browser bookmarklet for Easy Apply](#13-browser-bookmarklet-for-easy-apply)
14. [Plug your own résumé back-of-the-house](#14-plug-your-own-rsum-back-of-the-house)
15. [Data ownership & export](#15-data-ownership--export)

---

## 1. Search 8 sources every 30 minutes

| Source | Coverage | Default | How to disable |
|---|---|---|---|
| **LinkedIn** | All markets, requires nothing | ✓ on | `ENABLE_LINKEDIN_SEARCH=false` in `.env` |
| **Indeed** | All markets | ✓ on | `ENABLE_INDEED=false` |
| **Naukri Gulf** | UAE, KSA, Qatar, Bahrain, India | ✓ on | `ENABLE_NAUKRIGULF=false` |
| **Bayt** | UAE, KSA, Qatar | ✓ on | `ENABLE_BAYT=false` |
| **GulfTalent** | UAE, KSA, Qatar, Egypt | ✓ on | `ENABLE_GULFTALENT=false` |
| **RemoteOK** | Remote roles globally | ✓ on | `ENABLE_REMOTEOK=false` |
| **CompanyCareers** | 40+ company ATS (Greenhouse/Lever/Workable/Ashby) — Airbnb, Stripe, Anthropic, OpenAI, Vercel, Careem, Kitopi, Tabby, Tamara, Cursor, Notion, Linear, Datadog, Snowflake, MongoDB, Atlassian, Asana, DoorDash, Robinhood, Discord, Reddit, Twilio… | ✓ on | `ENABLE_COMPANY_CAREERS=false` |
| Glassdoor | Coming Q3 2026 | – | – |

> **Want a specific company added?** Open `sources/company_careers.py`,
> add a `("greenhouse", "their_slug", "Friendly Name")` line to the
> `COMPANIES` list, save, run a cycle. Done.

Each source has its own scraper file at `sources/<name>.py`. They all
implement the same `search(title, location) -> List[Dict]` interface so
adding a new one is one file.

---

## 2. AI-powered résumé scoring (Gemini)

Every new job is scored 0-100 by Gemini Flash against your résumé. The
score lives in the `match_score` column of the `jobs` table and shows up
on the dashboard as a colored chip.

- **80+** → tailored email goes out
- **60–79** → generic cover letter goes out
- **<60** → dropped entirely (configurable via `AI_MIN_MATCH=60`)

Gemini also returns a **one-line reason** for each match — visible in the
dashboard ("AI says: matches your fintech + Singapore experience").

Free tier: **1500 requests/day**. JobyBots' typical day uses ~150 — you
have huge headroom even on the free Google AI Studio plan.

### Disable AI scoring entirely

```ini
AI_ENABLED=false      # Falls back to keyword overlap scoring
```

The bot still works without AI — just less intelligent matching.

---

## 3. Tailored cover letters per job

For every job above the threshold, Gemini drafts a **4–6 sentence email**
that:
- Quotes a specific phrase from the JD
- References a relevant bullet from your résumé
- Closes with your phone number + LinkedIn
- Sounds like *you*, not a template

The full prompt and templates live in `core/ai_writer.py` and
`templates/email_*.j2`. You can edit either to change the voice.

### Disable AI emails (use classical templates)

```ini
AI_ENABLED=false
```

You'll get the regular Jinja2 templates from `templates/`, which are
still personalized with your name + résumé highlights but not LLM-rephrased.

---

## 4. Validated recruiter emails (no bounces)

Before any email is sent, JobyBots runs this check (`core/email_validator.py`):

```
syntax-ok ──► MX DNS lookup ──► cache result for 30 days
   │              │
   no              no
   ↓              ↓
  SKIP           SKIP
```

If we don't already have a recruiter address for a company, JobyBots tries:
1. The market's curated `markets/secondary_<country>.json` list
2. Common HR aliases: `careers@`, `jobs@`, `hr@`, `talent@`, `hiring@`
3. **Never** personal guesses (no `john.doe@company.com`) — too risky for deliverability

Results land in `email_cache` so we don't re-validate the same address
every cycle.

---

## 5. 200 personalized emails per day

Hard daily cap, configurable per user:

```ini
DAILY_EMAIL_CAP=200       # default — gentle on Gmail
DAILY_EMAIL_CAP=100       # conservative
DAILY_EMAIL_CAP=300       # aggressive (risk of spam flag)
```

Sends are spaced **30–120 seconds apart** with jitter — no two cycles
look the same, no human-detectable rhythm. The bot stops sending the
moment the cap is reached and resumes the next calendar day at 00:01.

> **Why not 500/day?** Gmail's unwritten limit is ~500 messages/day before
> reputation issues. 200 keeps you comfortably in the green and lets you
> blast for years without your inbox getting flagged.

---

## 6. GDPR-safe mode for EU markets

The bot **does not cold-email** in markets where it's legally risky.
Each country file (`markets/secondary_<country>.json`) carries a
`gdpr_strict` flag. When `true`:

- No emails are sent for that market.
- Matching jobs still show up in your daily HTML inbox + dashboard.
- The inbox gives you an "Apply on company website" link instead.

Defaults:

| Market | GDPR strict? |
|---|---|
| UAE, KSA, Qatar, Bahrain, Kuwait | ✗ (email allowed B2B) |
| Singapore | ✗ (PDPA B2B carve-out) |
| **Germany**, **Netherlands**, **Ireland**, **Sweden** | ✓ STRICT |
| **UK** | ✓ STRICT (PECR) |
| Canada | ✗ (CASL B2B carve-out) — opt-out footer added |
| India | ✗ (DPDP B2B) |

---

## 7. Daily 9 AM digest email

Every morning at the hour set in `DAILY_SUMMARY_HOUR=9`, JobyBots emails
you the **top 25 AI-matched jobs of the last 24 hours**. Each has:

- A big colored match-score chip (92%, 88%, …)
- One-line Gemini reason
- One-click "Apply" link (opens LinkedIn / Indeed / etc.)

Open the email on your phone over breakfast. Click Apply on the ones you
like. That's the whole job-hunting routine.

To turn off the digest:
```ini
DAILY_SUMMARY_HOUR=0     # 0 disables the digest
```

---

## 8. Click & Apply HTML inbox

`data/click_apply_inbox.html` — a static HTML file that opens in your
browser and shows every job currently in your pipeline. Refreshes every
10 minutes if you leave the tab open.

Each row has:
- Job title + company + location
- AI match score
- Status (queued / emailed / replied / archived)
- **"Open & Apply" button** that takes you straight to LinkedIn Easy Apply
  with your data pre-fillable via the bookmarklet (Feature 13)

Best for: knocking out 20 Easy Apply jobs in 10 minutes on a coffee break.

---

## 9. Live local dashboard

Run `DASHBOARD.bat` (Win) or `mac/Dashboard.command` and open
`http://localhost:8080`. You'll see:

- **KPI tiles**: Matched today, Sent today, Bounces, Sources active
- **Sparklines**: 7-day jobs found + emails sent trend
- **Live activity log**: every search call, AI score, email send (last 60 events)
- **Ranked job list**: top 50 by score with Apply buttons + Gemini reasons
- **Bounce list** (if any): emails that bounced, why, and when

Refreshes every 1.8 seconds. The dashboard runs on your laptop only —
nobody else can see it without your IP and port.

---

## 10. Multi-market job hunting

`PRIMARY_MARKET` is where you live; `SECONDARY_MARKETS` is everywhere else
you'd consider relocating. Default:

```ini
PRIMARY_MARKET=UAE
SECONDARY_MARKETS="Singapore,Germany,Netherlands,Ireland,Sweden,Canada,UK"
```

The bot searches all primary + secondary markets each cycle, then weights
primary jobs slightly higher in the digest. Add or remove markets any
time — restart not needed.

Supported markets right now: **UAE, KSA, Qatar, Bahrain, Kuwait, Egypt,
India, Singapore, Germany, Netherlands, Ireland, Sweden, UK, Canada,
Australia**. Adding one means writing a small JSON file in `markets/` —
we can do it for you in 10 minutes if you ask.

---

## 11. Bounce tracking + automatic blacklist

After every cycle, `core/bounce_tracker.py` reads your Gmail IMAP inbox
for Mailer-Daemon replies, parses bounce codes (4xx soft / 5xx hard) and
writes the dead address to `invalid_emails`. That address is **never**
emailed again — not by you, not by JobyBots, ever.

To see your current bounce list:
```powershell
.venv\Scripts\python.exe -c "import sqlite3; rows = sqlite3.connect('data/jobybot.db').execute('SELECT email, reason FROM invalid_emails ORDER BY bounced_at DESC LIMIT 20').fetchall(); [print(r) for r in rows]"
```

Or run `CHECK_BOUNCES.bat` which does the scan + summary in one click.

---

## 12. Auto-schedule (set & forget)

| OS | One-click | What it does |
|---|---|---|
| Windows | `START_AUTOSCHEDULE.bat` | Registers `JobybotHourly` task in Windows Task Scheduler |
| macOS | `mac/StartAutoSchedule.command` | Installs `~/Library/LaunchAgents/com.jobybots.scheduler.plist` |

Both run `jobybot.py run` every `RUN_INTERVAL_MINUTES` (default 30). The
schedule survives reboots and user logouts. Stop any time with
`STOP-Bot.command` or menu → option 4.

---

## 13. Browser bookmarklet for Easy Apply

In your daily digest email, the **Apply** button for LinkedIn Easy Apply
opens the job *and* injects a small JavaScript that pre-fills:

- Your phone
- Your visa status
- Your notice period
- Your résumé file path
- The standard "Why are you a fit?" answer from your `USER_SUMMARY`

You just review and click **Submit**. Each LinkedIn application drops from
3 minutes to ~15 seconds.

To install the bookmarklet:
1. Open `data/click_apply_inbox.html` in your browser
2. Drag the orange **"Apply Pre-Fill"** button to your bookmarks bar
3. Done — works on any future LinkedIn Easy Apply page

---

## 14. Plug your own résumé back-of-the-house

Your résumé lives at the path in `RESUME_PATH=` (default `./resume.pdf`).
Update it anytime — JobyBots re-parses it at the start of every cycle, so
the next run uses the latest version.

To preview what the parser sees:
```powershell
.venv\Scripts\python.exe -c "from core.resume_parser import parse_resume; from config import get_settings; s = get_settings(); p = parse_resume(s.resume_path); print(p)"
```

You'll see the extracted skills, titles, years, and summary block.

---

## 15. Data ownership & export

Everything JobyBots knows about your job hunt is in **one SQLite file**:
`data/jobybot.db`. Open it in any tool — DBeaver, SQLiteStudio, even
Excel via ODBC.

Useful one-liners:

```powershell
# Export today's jobs to CSV
.venv\Scripts\python.exe -c "import sqlite3,csv; c=sqlite3.connect('data/jobybot.db'); rows=c.execute(\"SELECT * FROM jobs WHERE date(found_at)=date('now')\").fetchall(); cols=[d[0] for d in c.execute('SELECT * FROM jobs LIMIT 0').description]; w=csv.writer(open('jobs_today.csv','w',newline='',encoding='utf-8')); w.writerow(cols); w.writerows(rows)"

# Export emails sent this month
.venv\Scripts\python.exe -c "import sqlite3,csv; c=sqlite3.connect('data/jobybot.db'); rows=c.execute(\"SELECT * FROM emails_sent WHERE strftime('%Y-%m',sent_at)=strftime('%Y-%m','now')\").fetchall(); cols=[d[0] for d in c.execute('SELECT * FROM emails_sent LIMIT 0').description]; w=csv.writer(open('emails_thismonth.csv','w',newline='',encoding='utf-8')); w.writerow(cols); w.writerows(rows)"
```

You can also rsync `data/` to a Dropbox / iCloud folder for backup — the
SQLite file is checkpoint-safe and survives partial syncs.

---

## What's next

- See **`docs/CUSTOMER_TERMINAL_WALKTHROUGH.md`** for a copy-paste session
  that runs every feature in 15 minutes.
- See **`docs/POWERSHELL_SCRIPTS.md`** for the full PowerShell command
  library.
- See **`docs/SECURITY.md`** to understand exactly what JobyBots does
  with your data (spoiler: nothing leaves your laptop).

Stuck on anything? Email **tharakesh.iitp@gmail.com** or WhatsApp
**+91 7989931325**. Replies within 1 hour, Mon-Sat 10:00–20:00 IST.
