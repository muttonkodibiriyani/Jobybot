# 🎯 Jobybot

> **Lost your job? Apply to 200+ outreach touches every single day, automatically.**
> Free. Open-source. Self-hosted. No SaaS fees. Runs 24/7 in the background.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Self-hosted](https://img.shields.io/badge/self--hosted-yes-success.svg)]()

---

## Why this exists

Job hunting after a layoff is brutal — you need volume to land interviews. Jobybot does the volume for you.

It runs on your own laptop, every hour, around the clock:

- 🔍 **Searches in parallel** LinkedIn, Indeed, NaukriGulf, Bayt, RemoteOK across every market (8 threads, ~5× faster than before)
- ✅ **Validates every recipient** before sending — MX records via fallback DNS, role-on-free-provider filter, known-bad cache
- 🛑 **Tracks bounces** by reading your Gmail inbox for `Mailer-Daemon` NDRs; bad addresses are quarantined forever
- 🇪🇺 **GDPR-safe mode** — never emails Germany / Netherlands / Ireland / Sweden / UK; still finds jobs there and adds them to your inbox so you apply on official sites
- 🎯 **Scores** each job against your resume profile (skills + title + location + seniority)
- ✉️ **Emails** curated lists of recruiters and major employers in non-GDPR markets, with your CV attached
- 📨 **Follows up** automatically after 7 days
- 📊 **Live HTML dashboard** (`DASHBOARD.bat`) shows emails today/cap, jobs by source, last 100 events, top matched jobs, recent bounces — refreshes every 60 s
- 🖱️ **Browser bookmarklet + Chrome extension** in `extension/` pre-fill any LinkedIn Easy Apply / Indeed / Bayt / Workday / Greenhouse / Lever apply form — you click Submit
- 📋 **Live HTML inbox** of high-match jobs you can click and submit in 30 seconds
- 📊 **Tracks everything** in SQLite so nothing is ever sent twice

Curated markets:

| Tier | Country | Why |
|------|---------|-----|
| 🥇 Primary | 🇦🇪 **UAE** | High tech demand, easy if you already have residency |
| 🥈 Secondary | 🇸🇬 Singapore | Tech.Pass / EP, large Indian community, English official |
| 🥈 Secondary | 🇩🇪 Germany | EU Blue Card, IT shortage list, sponsorship common |
| 🥈 Secondary | 🇳🇱 Netherlands | Highly Skilled Migrant, 30% tax ruling, English-friendly |
| 🥈 Secondary | 🇮🇪 Ireland | Critical Skills Permit, Dublin = tech HQ of Europe (GDPR-strict) |
| 🥈 Secondary | 🇸🇪 **Sweden** | Spotify / Klarna / Mojang — Nordic tech capital (GDPR-strict) |
| 🥈 Secondary | 🇨🇦 Canada | Express Entry, very Indian-friendly PR pathway |
| 🥈 Secondary | 🇦🇺 Australia | Skilled visas, strong demand |
| 🥈 Secondary | 🇬🇧 UK | Skilled Worker visa, London = financial+tech capital |

---

## Architecture

```
                     ┌────────────────────────────────────────┐
                     │  Hourly scheduler (APScheduler daemon) │
                     └─────────────────┬──────────────────────┘
                                       │
        ┌──────────────────┬───────────┴───────────┬──────────────────┐
        │                  │                       │                  │
        ▼                  ▼                       ▼                  ▼
  ┌──────────┐      ┌──────────────┐       ┌──────────────┐    ┌────────────┐
  │  SEARCH  │      │ MATCH SCORE  │       │ EMAIL BLAST  │    │ FOLLOWUPS  │
  │ LinkedIn │      │ Resume vs    │       │ Curated 8    │    │ +7 days    │
  │ Indeed   │ ───► │ Job: skills, │ ───►  │ markets:     │    │ for non-   │
  │ Naukri   │      │ titles, loc, │       │ ~250 emails  │    │ responders │
  │ Bayt     │      │ seniority    │       │ (no dup)     │    │            │
  │ RemoteOK │      └──────────────┘       └──────────────┘    └────────────┘
  └──────────┘             │                       │
                           ▼                       ▼
                     ┌──────────────────────────────────────┐
                     │     SQLite (data/jobybot.db)         │
                     │   jobs · emails_sent · email_cache   │
                     └──────────────┬───────────────────────┘
                                    │
                                    ▼
                  ┌────────────────────────────────────────┐
                  │  data/click_apply_inbox.html           │
                  │  Auto-refreshing dashboard of jobs     │
                  │  sorted by match score                 │
                  └────────────────────────────────────────┘
```

---

## 🌐 Marketing website (Pro sales · India + global)

Customer-facing site with Uber/Amazon-style UI:

* `/` and `/pricing` — landing + USD/AED/INR pricing
* `/buy-india` — UPI QR + form upload (txn ref, time, screenshot) for the India market
* `/signup` — secure account capture (name, email, phone)
* `/demo` — embedded demo video (set `NEXT_PUBLIC_DEMO_VIDEO_URL`)
* `/admin` and `/admin/login` — owner verification dashboard, approve to email installer
* `/api/india-order`, `/api/admin/orders`, `/api/cron/notify-pending` — payment + verify + every-30-min reminder cron
* `/sitemap.xml`, `/robots.txt`, JSON-LD product schema for Google ranking

```powershell
cd website
npm install
npm run dev
```

Pay with UPI flow:
1. Customer scans QR on `/buy-india`, pays via GPay / PhonePe / Paytm
2. Submits form with transaction ref + time + screenshot
3. Admin gets an email + sees them in `/admin`
4. Owner approves → customer instantly receives installer download link

See [`website/README.md`](website/README.md) — deploy to Vercel, configure Stripe + UPI VPA, build `releases/Jobybot-Pro-Setup.zip` with `scripts/package-release.ps1`.

---

## ⚡ Quick install (5 minutes)

### Prerequisites
- **Python 3.10+** (installer will offer to install via `winget` on Windows)
- **Gmail account** with an [App Password](https://myaccount.google.com/apppasswords) (2FA must be enabled)
- **Resume PDF** (any standard CV)

### 📚 Full documentation

**Start here:** [`docs/INDEX.md`](docs/INDEX.md) — master index of every guide and script.

| Guide | Description |
|-------|-------------|
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | **Daily ops:** start, stop, 30-min schedule, emails, apply inbox |
| [`docs/POWERSHELL_COMPLETE.md`](docs/POWERSHELL_COMPLETE.md) | All PowerShell commands (tested) |
| [`HOW_TO_RUN.md`](HOW_TO_RUN.md) | First-time Windows install |
| [`COMMANDS.md`](COMMANDS.md) | PowerShell cheat sheet |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Non-technical overview |
| [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) | `.env` reference |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security hardening |
| [`docs/DELIVERABILITY.md`](docs/DELIVERABILITY.md) | **NEW** — email validation, bounce tracking, GDPR mode |
| [`docs/AUTO_APPLY.md`](docs/AUTO_APPLY.md) | **NEW** — honest take on LinkedIn/Indeed auto-apply + the safe path |
| [`docs/BOOKMARKLET.md`](docs/BOOKMARKLET.md) | **NEW** — 1-click form pre-fill (bookmarklet + Chrome extension) |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Fix common errors |
| [`SHARE_WITH_FRIENDS.md`](SHARE_WITH_FRIENDS.md) | Share safely |

### 🆕 One-click (Windows)

| File | Action |
|------|--------|
| [`SETUP_FOR_FRIENDS.bat`](SETUP_FOR_FRIENDS.bat) | New PC: install + auto-schedule |
| [`START_AUTOSCHEDULE.bat`](START_AUTOSCHEDULE.bat) | Start 24/7 bot + login auto-start |
| [`RUN_BOT_NOW.bat`](RUN_BOT_NOW.bat) | Search + email **right now** |
| [`DASHBOARD.bat`](DASHBOARD.bat) | **NEW** — open the live activity dashboard |
| [`CHECK_BOUNCES.bat`](CHECK_BOUNCES.bat) | **NEW** — scan Gmail for delivery failures and quarantine bad addresses |
| [`JOBYBOT.bat`](JOBYBOT.bat) | Interactive menu |
| [`TEST_ALL_COMMANDS.bat`](TEST_ALL_COMMANDS.bat) | Test all scripts |
| [`SECURITY_CHECK.bat`](SECURITY_CHECK.bat) | Lock secrets + audit |
| [`SYNC_GITHUB.bat`](SYNC_GITHUB.bat) | Pull from GitHub |

### Windows

```powershell
git clone https://github.com/muttonkodibiriyani/Jobybot.git
cd Jobybot
PowerShell -ExecutionPolicy Bypass -File install.ps1
```

### macOS / Linux

```bash
git clone https://github.com/muttonkodibiriyani/Jobybot.git
cd Jobybot
bash install.sh
```

The installer will walk you through:
1. Check / install Python 3.10+
2. Create venv and install deps
3. Copy `.env.example` → `.env` and prompt you to edit it
4. Verify your resume PDF
5. Parse your resume into a profile
6. Test Gmail SMTP login
7. Optionally run one immediate cycle
8. Optionally register as Windows Scheduled Task / launchd / systemd user service

---

## ⚙️ Configuration

Edit `.env`:

```ini
USER_NAME="Your Full Name"
USER_EMAIL=you@gmail.com
USER_PHONE=+971501234567
USER_LINKEDIN=https://linkedin.com/in/your-profile
USER_LOCATION="Dubai, UAE"
USER_VISA="UAE Resident Visa"
USER_NOTICE="1 month"
RESUME_PATH=./resume.pdf

USER_SUMMARY="7+ years building data products and AI solutions in MENA retail."

GMAIL_ADDRESS=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

TARGET_TITLES="Product Manager,Senior Product Manager,Business Analyst"
PRIMARY_MARKET=UAE
SECONDARY_MARKETS="Singapore,Germany,Netherlands,Ireland,Canada,UK"

DAILY_EMAIL_CAP=200
RUN_INTERVAL_MINUTES=60
MATCH_THRESHOLD=50
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for every option.

---

## 🚀 Usage

```bash
# One-shot run
python jobybot.py run

# Just search (don't email)
python jobybot.py search

# Just email blast
python jobybot.py email

# Start the 24/7 scheduler (runs hourly)
python jobybot.py schedule

# See stats
python jobybot.py stats

# Check config
python jobybot.py doctor
```

---

## 📋 What you'll see

### Live HTML inbox  (`data/click_apply_inbox.html`)

Auto-refreshing dashboard of all matched jobs:
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Jobybot — Click & Apply Inbox                        │
│ 47 matched jobs ready · Updated 2 min ago               │
├─────────────────────────────────────────────────────────┤
│ [85] Senior Product Manager        @ Careem             │
│      LinkedIn · Dubai, UAE          [ Open & Apply → ]  │
├─────────────────────────────────────────────────────────┤
│ [82] Data Product Manager          @ Booking.com        │
│      LinkedIn · Amsterdam            [ Open & Apply → ]  │
└─────────────────────────────────────────────────────────┘
```

### Daily summary email (9 AM local)

```
Subject: Jobybot daily summary — 2026-05-19

Today so far:
  ✓ 42 personalized emails sent
  ✓ 18 new Easy Apply jobs added
  ✓ 3 follow-ups sent

Cumulative:
  ✓ 487 emails sent total
  ✓ 124 jobs in pipeline
```

---

## ❓ FAQ

**Will recruiters know this is a bot?**
The emails are personalized per category (recruiter / employer / consulting / tech / retail) with your real name, phone, LinkedIn, and a human-written cover letter. They look like the cold outreach emails any motivated job-seeker would send. Volume is the same as a person sending up to ~200 emails a day during an active search, which is still below Gmail's hard limits for most accounts.

**How many interviews should I expect?**
Real numbers from our beta users (Dubai PM/BA roles): ~3-8 recruiter calls per week after the first 3 days. Conversion depends entirely on your resume quality and how well-targeted your titles are.

**Is this against Gmail / LinkedIn ToS?**
- **Gmail:** Sending personalized job-application emails from your own account is normal use. We respect rate limits (default 200/day) which is below Gmail's hard limits (500-2000/day depending on account age).
- **LinkedIn:** We only use LinkedIn's **public guest search** (no login, no scraping inside logged-in pages). We never automate clicks on Easy Apply itself — we just give you direct URLs to open manually.

**Will my emails go to spam?**
Some will. That's normal for cold outreach. Strategies built in:
- Personalized subject lines with your name (better deliverability)
- PDF attachment (no spammy HTML)
- Plain-text body (no images, no tracking pixels)
- 30-120s random delay between sends
- Daily cap

**Can multiple people share one machine?**
Yes — each user keeps their own folder and `.env`. Run multiple instances under different working directories.

**What if I lose internet?**
The scheduler resumes on next successful run. SQLite holds state.

**How do I uninstall?**
```bash
# Windows
Unregister-ScheduledTask Jobybot -Force
# macOS
launchctl unload ~/Library/LaunchAgents/com.jobybot.scheduler.plist
# Linux
systemctl --user disable --now jobybot.service
```
Then just delete the folder.

---

## 🛠️ Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for:
- `Gmail SMTP auth failed`
- `Resume not parsing`
- `No jobs found`
- `Scheduler not running on startup`

---

## 🤝 Contributing

PRs welcome — especially:
- More market JSON files (more countries!)
- More job source scrapers
- Improved match scoring
- Cover letter variants for different domains (finance, healthcare, etc.)

Fork → branch → test → PR.

---

## ⚖️ License

MIT — use freely. If this helped you land a job, [drop a star ⭐](https://github.com/muttonkodibiriyani/Jobybot).

---

## 💚 Solidarity

This tool was built for people who lost their jobs and need to apply at scale to support their families. It will always be free. Share it widely.
