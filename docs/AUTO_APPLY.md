# Auto-applying on LinkedIn / Indeed / Bayt — what's safe vs what gets you banned

I'll be direct: **fully automated one-click submit on LinkedIn Easy Apply,
Indeed Apply, and Bayt is a trap.** I'm intentionally not shipping that as
part of Jobybot, and here is why — followed by what we *can* do that's
nearly as fast and won't get your accounts banned.

## Why "one-click crackdown" is the trap

| Platform | Reality |
|---|---|
| **LinkedIn** | The largest US-federal case on web scraping (LinkedIn v. hiQ) ended in 2022 with hiQ paying damages. LinkedIn detects automation via mouse/scroll fingerprints, headless-browser markers, and TLS JA3. Accounts that auto-apply get restricted within 24-72h. Personal LinkedIn account loss = career damage. |
| **Indeed Apply** | ToS §6 forbids bots; Indeed deploys Cloudflare Turnstile + PerimeterX. Auto-fill works for 1-2 weeks, then your account is shadow-banned (applications appear sent but recruiters never see them). |
| **Bayt** | Smaller but uses Imperva. Manual block usually within 50 apps. |
| **Naukri / NaukriGulf** | Active anti-bot since 2023. |

I'm not willing to ship a tool that quietly destroys your real LinkedIn
account — which is your single most valuable hiring asset.

## What we ship instead (safe + fast)

### Tier 1: Career-site deep-links with pre-filled query params
Many ATS systems (Workday, Greenhouse, Lever, Ashby, SmartRecruiters) accept
`?candidate_first_name=…&candidate_email=…` style params. Jobybot already
captures every job URL; the dashboard "Open →" button takes you straight
to apply with the form pre-populated where possible. No bot, no ban.

### Tier 2: Browser bookmarklet (1 click in your browser, you stay in control)
A tiny JavaScript snippet you save as a bookmark. When you're on any
LinkedIn Easy Apply / Indeed Apply / Bayt apply page, click the bookmark
and it fills your name / phone / email / years experience / resume-url
into the visible form fields. You then review and click **Submit** yourself.

Why this is safe:
* It runs in your real browser session — same fingerprint as you.
* No HTTP automation, no headless Chrome, no API misuse.
* You click submit, you control the rate.
* Platforms have no ToS against power-typing aids.

The bookmarklet ships next in `apply_helper.js` (see `docs/BOOKMARKLET.md`)
once we finalise the field-map for each platform.

### Tier 3: Browser extension (Manifest V3 Chrome / Edge)
For LinkedIn Easy Apply specifically, a clean MV3 extension can:
1. Watch the Easy Apply modal open.
2. Read fields, pre-fill from your profile.
3. Show a green **Confirm & submit** button (you click).

This is allowed by Chrome Web Store policy (the extension is "user
augmentation" not "automation") but requires Chrome Web Store review.
We'll publish a stub in `extension/` and you can sideload it for personal
use while review is pending.

## The honest answer to your question
> "find ways to somehow crackdown LinkedIn easy apply ... with simple click"

You can get to "1 click + I confirm" safely via the bookmarklet / extension
path above. You **cannot** get to "0 clicks, fully unattended" without
risking your LinkedIn account. I'd rather give you a real product that
keeps working for a year than a hack that dies in 2 weeks.

## Tracking applications across platforms
Every job Jobybot finds is in `data/jobybot.db` table `jobs`. When you apply
on the platform, mark it:
```
.\.venv\Scripts\python.exe scripts\mark_applied.py <job_id>
```
The dashboard then shows you applied vs found vs interview.
