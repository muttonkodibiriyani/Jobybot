# JobyBots — Customer Installer Storyboard

10 photorealistic frames showing the **complete customer-side install journey**, from "I just paid" to "first recruiter reply". Use these to build:

- A 60-second installer demo video for the homepage / Product Hunt launch.
- An onboarding email drip (each frame = one email).
- The `/install` page on jobybots.com.
- Friend / referral shareable carousel for WhatsApp / X / LinkedIn.

---

## Frame list

| # | File | Story beat | Suggested voice-over (one sentence) |
|---|------|------------|-------------------------------------|
| 01 | `install-01-email.png` | Installer email arrives in Gmail | "Right after you pay, your installer link arrives — license key included." |
| 02 | `install-02-extract.png` | ZIP extracted, 13 `.bat` files visible | "Unzip the folder — everything you need is one double-click away." |
| 03 | `install-03-smartscreen.png` | One-time Windows trust prompt | "Windows will ask once — click *More info* then *Run anyway*. Just once." |
| 04 | `install-04-wizard.png` | Setup wizard asks 5 questions | "A friendly wizard asks for your resume, Gmail, Gemini key, job titles, cities. Done in two minutes." |
| 05 | `install-05-verify.png` | All 6 health checks pass | "It tests SMTP, Gemini, your database — green checks across the board." |
| 06 | `install-06-scheduled.png` | Bot scheduled · runs 24/7 | "From this moment, JobyBots works while you sleep — every hour, in the background." |
| 07 | `install-07-menu.png` | Control center with 18 actions | "One menu, 18 one-key actions. Start, stop, stats, test email — all one number away." |
| 08 | `install-08-interconnect.png` | How the `.bat` files connect | "Six files, one mental model: schedule → cycle → search → email → dashboard." |
| 09 | `install-09-dashboard.png` | Live dashboard updates every 15s | "Open the dashboard any time — emails sent, bounces, replies — all live." |
| 10 | `install-10-replies.png` | First 6 recruiter replies | "Five days later — six replies. That's the whole product." |

---

## How the .bat files connect (truth, not marketing)

```
┌─────────────────────────────────────────────────────────────┐
│  JOBYBOT.bat   →  jobybot-menu.ps1   (interactive menu)     │
└─────────────────────────────────────────────────────────────┘
              │
              ├──→ SETUP_FOR_FRIENDS.bat → install-friends.ps1   (one-time)
              │
              ├──→ START_AUTOSCHEDULE.bat
              │       ├─ powershell/13-Stop-Bot.ps1              (clean slate)
              │       ├─ scripts/enable_autostart.ps1            (login task)
              │       ├─ powershell/15-Start-Background.ps1      (24/7 scheduler)
              │       └─ python jobybot.py schedule              (hourly run)
              │                              │
              │                              └──→ scripts/run_one_cycle.py
              │                                       (search → score → email)
              │
              ├──→ RUN_BOT_NOW.bat   (single ad-hoc cycle)
              │       ├─ scripts/open_dashboard.py
              │       └─ python jobybot.py run
              │
              ├──→ DASHBOARD.bat            (opens /dashboard in browser)
              ├──→ CHECK_BOUNCES.bat        (IMAP sync · bounce backfill)
              ├──→ DELIVERABILITY_CHECK.bat (90-day deliverability snapshot)
              ├──→ SECURITY_CHECK.bat       (scan .env + secrets)
              ├──→ TEST_ALL_COMMANDS.bat    (full self-test)
              ├──→ SYNC_GITHUB.bat          (git pull + reinstall deps)
              ├──→ OPEN_WEBSITE.bat         (open jobybots.com)
              └──→ BUILD_CUSTOMER_PACKAGE.bat (rebuild shareable ZIP)
```

Every customer-facing `.bat` is a one-line wrapper that calls into a single Python or PowerShell entry point. There is **no hidden plumbing**.

---

## Recommended sequencing

### Option A — One 60-second video (best for landing page)
Per-frame timing: **6 seconds each** (10 frames × 6s = 60s).
- Hold each image 4.5s, cross-fade 1.5s.
- Background music: warm ambient (e.g., Epidemic Sound "Morning Light").
- Voice over: read the one-sentence script above per frame.
- Add a single end-card frame: "Try JobyBots — `jobybots.com` — ₹2,999 lifetime".

### Option B — 10 carousel posts (LinkedIn / X / Instagram)
Post one per day or all at once with consistent captions:
- Hook: "Installing JobyBots is 10 doors away from your next job offer."
- Frame caption: the one-sentence voice-over.
- CTA on last slide: "Get yours → jobybots.com".

### Option C — Onboarding email drip
Day 0 → email frame 01–03 ("Welcome, here's how to install").
Day 1 → email frame 04–06 ("Setup, verify, scheduled").
Day 2 → email frame 07–10 ("Menu, dashboard, first replies").

### Option D — `/install` page on website
Show all 10 as a vertical scroll story with one big H2 per frame. Pure storytelling, no jargon.

---

## Software paths (free → pro)

| You have | Use |
|----------|-----|
| Just want a quick video | **Canva** → Magic Design → Slideshow → upload 10 frames in order → add music + voiceover. 15 min. |
| Want narration with Ken Burns | **Descript** (free tier) → drag frames, hit "Underlord" for AI voiceover, export 1080p. 25 min. |
| Want a polished final | **DaVinci Resolve** (free) → 16:9 timeline @ 30 fps → drop frames @ 6s each → add slow zoom (scale 1.0→1.05 per frame) → add lower-third text. 45 min. |
| Want it for free online | **Clipchamp** (built into Windows 11) → drag frames → music + AI voiceover → export. 20 min. |

---

## Voice-over master script (60 seconds, ~150 words)

> "You bought JobyBots. Your installer email arrives in your inbox.  
> You unzip the folder — everything is one double-click away.  
> Windows asks for permission once. Click *Run anyway*.  
> A friendly wizard asks five quick questions — your resume, your Gmail, your job titles.  
> It checks every system. Green across the board.  
> From this moment, JobyBots works for you 24/7, while you sleep.  
> One control center. Eighteen one-key actions.  
> Six files, one mental model — schedule, cycle, search, email, dashboard.  
> Open the live dashboard any time to see what's happening.  
> Five days later — six recruiter replies. That's the whole product.  
> JobyBots dot com. Job hunting, finally automated."

---

## Tips

- Keep cuts on the beat — don't be afraid of silence.
- Show a **real cursor** in the screen recordings if you re-shoot.
- The colour palette is `#FF6B1A` (orange) and `#0D1B2A` (navy) — match overlays.
- For thumbnails: frame 10 (six replies) is the most click-worthy.
- For the homepage hero loop: frame 07 (menu) or frame 09 (dashboard) — both convey "alive and working".
