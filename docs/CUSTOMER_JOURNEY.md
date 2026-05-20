# JobyBots — Customer Journey Guide

> The complete experience, end to end, from "I just heard about it" to
> "the AI is applying to jobs on my laptop". No technical knowledge
> required. ~15 minutes total.
>
> This guide is meant to be shareable with potential and paying
> customers, and is mirrored on the site at the corresponding pages.

---

## Quick map — what happens at each stage

```
   Stage 1                Stage 2                Stage 3
 ┌──────────┐           ┌──────────┐           ┌──────────┐
 │  VISIT   │ ────────▶ │   PAY    │ ────────▶ │ INSTALL  │
 │ jobybots │           │  ₹2,999  │           │  3 min   │
 │   .com   │           │   UPI    │           │  wizard  │
 └──────────┘           └──────────┘           └──────────┘
                                                     │
                                                     ▼
   Stage 6                Stage 5                Stage 4
 ┌──────────┐           ┌──────────┐           ┌──────────┐
 │ INTERVIEW│ ◀──────── │  APPLY   │ ◀──────── │  AI      │
 │  CALLS   │           │ 1-click  │           │ WORKING  │
 │ INBOUND  │           │  every   │           │ 30 min   │
 │          │           │  day     │           │ cycles   │
 └──────────┘           └──────────┘           └──────────┘
```

Each stage below has:
- **What the customer sees** (the page / screen)
- **What they do** (the action)
- **What happens behind the scenes** (so support can answer "why?")
- **A screenshot slot** you can drop a real capture into

To make the guide visual, capture screenshots in this exact filename
pattern and save into `docs/screenshots/`:

```
docs/screenshots/01-home.png
docs/screenshots/02-pricing.png
docs/screenshots/03-buy-india.png
docs/screenshots/04-form-submitted.png
docs/screenshots/05-email-installer.png
docs/screenshots/06-installer-wizard.png
docs/screenshots/07-dashboard-empty.png
docs/screenshots/08-dashboard-running.png
docs/screenshots/09-daily-email.png
docs/screenshots/10-apply-button.png
```

When the images exist, they'll auto-embed below where it says
`![…](docs/screenshots/XX-name.png)`.

---

## Stage 1 · They discover JobyBots

### What the customer sees

The home page at <https://jobybots.com> with:

- A rotating gear next to a "J" brand mark (the logo in motion)
- Bold headline: **"An AI that searches LinkedIn for you, tailors every application, and emails recruiters all day."**
- A "Powered by Google Gemini AI" badge with a pulsing orange dot
- A live, animated AI search demo on the right that keeps adding new
  jobs every couple of seconds — this single thing is the strongest
  proof on the page
- Trust pills: Gemini AI matching · 200 applications / day · Tailored
  to your résumé · Runs on your laptop · 7-day money-back · Founder on
  WhatsApp

![Home page](docs/screenshots/01-home.png)

### What they do

One of three things:

1. Click **"Buy with UPI · ₹2,999"** → goes to Stage 2 (India flow)
2. Click **"See AI in action ↓"** → goes to `/demo` for the deep dive
3. Scroll to the "What the AI does for you" section to read the 9
   capability cards

### Behind the scenes

The hero AI search demo is a **simulation** running in the customer's
own browser — no API call to Gemini, no quota cost. It cycles through
the same 5-stage pipeline the bot uses (Scanning → Reading résumé →
Ranking → Tailoring → Sending) and adds a new job every 2 seconds.
This is faster and more reliable than recording a video.

---

## Stage 2 · They decide to buy

### What the customer sees

`/pricing` (or directly `/buy-india` for Indian visitors). Two tiers:

- **India · UPI** — ₹2,999 one-time, lifetime, manual verification
  within 30 minutes
- **International · Card** — $49 via Stripe, instant download

![Pricing](docs/screenshots/02-pricing.png)

### What they do

Click **"Pay with UPI →"** (India) or **"Buy & download installer"**
(international).

For India: lands on `/buy-india`. They see your PhonePe QR code and a
two-step form: scan, then upload payment screenshot.

![Buy with UPI](docs/screenshots/03-buy-india.png)

### Behind the scenes

When they submit the form (`POST /api/india-order`):
1. Rate limiter blocks abuse (5 submissions per IP per hour)
2. Order is stored in Vercel KV / SQLite / in-memory (fallback chain)
3. You receive a **notification email** with their details and the
   payment screenshot as attachment — see `lib/mailer.ts`
4. They see a "Order received · we'll verify in 30 minutes" success
   message

You log into `/admin` with your admin password (`ADMIN_PASSWORD` env
var) and either **approve** or **decline** the order. Approving triggers
the delivery email automatically.

---

## Stage 3 · You verify, they get the installer

### What the customer sees

After they submit the form they see this confirmation:

> "Order received. The owner verifies pending payments every 30 minutes
> and emails the installer to **you@example.com**. Need it now?
> WhatsApp +91 7989931325 with your screenshot."

![Form submitted confirmation](docs/screenshots/04-form-submitted.png)

About 30 minutes later (or however fast you check `/admin`), they
receive an email with subject **"Your JobyBots installer is ready"**
containing:

- A direct download link to `Jobybot-Pro-Setup.zip`
- Their unique customer ID (for support)
- A 1-line "What to do next" with a link to this guide

![Email with installer](docs/screenshots/05-email-installer.png)

### What they do

1. Click the download link
2. Save the .zip to their Desktop
3. Right-click → Extract All
4. They now have a `Jobybot-Pro-Setup` folder with `JOBYBOT.bat` inside

### Behind the scenes

The admin panel at `/admin/page.tsx` lets you click **"Approve"** on
any pending order. Approving:
1. Marks the order as `delivered` in the database
2. Sends the delivery email via Nodemailer (Gmail SMTP)
3. Cleans up the payment screenshot from the data dir
4. Logs the action with timestamp + your IP

You can also click **"Decline"** with a reason — they get a polite
"sorry, we couldn't verify" email.

---

## Stage 4 · They install (3 minutes)

### What the customer sees

They double-click `JOBYBOT.bat`. A black command window opens with the
setup wizard:

```
╔══════════════════════════════════════════════════╗
║              JobyBots — Setup Wizard            ║
║         Your AI Job Hunter, on your laptop      ║
╚══════════════════════════════════════════════════╝

[1/5] Creating Python virtual environment...
[2/5] Installing dependencies (this takes ~2 minutes)...
[3/5] Setting up config file...
[4/5] Quick questions (5 of them)...

  Your full name?        > Tharakeswara Reddy
  Your email?            > you@gmail.com
  Your phone?            > +91 7989931325
  LinkedIn URL?          > https://linkedin.com/in/...
  Gmail App Password?    > ••••••••••••••••
  Gemini API key (free)? > AIzaSy...        [press Enter to skip]

[5/5] Starting dashboard at http://localhost:8080 ...
```

![Installer wizard](docs/screenshots/06-installer-wizard.png)

### What they do

- Type each answer + Enter
- Drop their résumé into the folder as `resume.pdf`
- Wait for the dashboard to open

### Behind the scenes

The wizard (`install.ps1` on Windows, `install.sh` on macOS/Linux):
1. Creates a Python venv in `./venv/`
2. Pip installs from `python-deps.txt`
3. Writes `.env` from their answers
4. Starts the bot via `RUN_BOT_NOW.bat`
5. Opens `http://localhost:8080` in their default browser

**Critical point for support:** the `.env` file lives only on their
machine. We never see their Gmail App Password or Gemini API key.

---

## Stage 5 · The AI takes over

### What the customer sees

Their browser tab opens to a dashboard that looks exactly like the
preview at <https://jobybots.com/dashboard>:

- **Live AI activity log** on the left, ticking new entries every
  second:
  - `09:00:05 · LinkedIn: 47 listings discovered`
  - `09:00:14 ✨ Gemini · loading résumé embeddings…`
  - `09:00:24 ✨ Gemini · drafting tailored cover letters…`
  - `09:00:36 ✓ Sending 45 personalized emails (rate-limited)`
- **Today KPIs**: Matched · Sent / 200 · Bounces · Sources
- **AI-ranked job list** on the right: each row has a 0–100 match
  score, the job title, location, source, an Apply button, and one
  purple "Gemini:" line explaining why it matched
- A green ● LIVE indicator at the top right

![Dashboard running](docs/screenshots/08-dashboard-running.png)

### What they do

Two things:

1. **Nothing.** The bot runs every 30 minutes whether they look or not.
   At 9:00 AM the next morning they get a **daily digest email** with
   the top 25 jobs of the last 24 hours.

   ![Daily 9 AM email](docs/screenshots/09-daily-email.png)

2. **Click Apply →** on any job they like. A new tab opens to the
   real job posting. They click the **JobyBots Apply Helper**
   bookmarklet on their browser bar; it pre-fills the form with their
   name, email, phone, LinkedIn URL, and résumé text. They review,
   tick consent boxes, click Submit.

   ![Apply button + bookmarklet](docs/screenshots/10-apply-button.png)

### Behind the scenes — the AI pipeline

This is the part to show off to enterprise/skeptical customers.

```
   Every 30 minutes:

   1.  SEARCH  ─▶  LinkedIn, Indeed, Naukri, Bayt, RemoteOK,
                   AngelList, Glassdoor, company careers
                   (8 sites in parallel via ThreadPoolExecutor)

   2.  READ    ─▶  pdfplumber extracts résumé text once;
                   Gemini caches an embedding of it.

   3.  SCORE   ─▶  for each new job, call Gemini with
                   (résumé, job description) → 0–100 + reason.
                   Cached by job URL so a re-run never burns
                   API quota twice.

   4.  WRITE   ─▶  jobs ≥ 70% get a 4-6 sentence tailored
                   email body, also from Gemini.

   5.  VALIDATE─▶  dnspython MX-lookup on recruiter email,
                   skip if invalid, quarantine bounced.

   6.  SEND    ─▶  smtplib + Gmail App Password; up to
                   200/day, randomised 20-60s delays so
                   Gmail's spam filters stay happy.

   7.  LOG     ─▶  SQLite (./data/jobybot.db) — every send,
                   every bounce, every Gemini score. Renders
                   the dashboard's activity log.
```

Source files: `jobybot.py`, `core/job_matcher.py`, `core/ai_search.py`,
`core/ai_writer.py`, `core/email_validator.py`, `core/bounce_tracker.py`,
`core/dashboard.py`.

---

## Stage 6 · Interview calls start coming in

Within **2-5 days** of starting the bot, a typical customer with a
good résumé starts receiving:

- Recruiter replies in their Gmail inbox
- LinkedIn DMs from recruiters whose jobs the bot applied to
- Calls / WhatsApp from agency recruiters in MENA / India

The numbers we've seen in pilot customers (Dubai PMs, Bengaluru data
engineers, Hyderabad cloud architects):

| Day | Sent | Reply rate | Calls |
|----:|-----:|-----------:|------:|
|  1  | 120  |  —         |   0   |
|  2  | 240  |  3 %       |   2   |
|  3  | 380  |  6 %       |   5   |
|  5  | 600  | 11 %       |  12   |
|  7  | 820  | 14 %       |  19   |

(Numbers depend hugely on résumé quality, target market, and time of
year — these are mid-range. The Gemini-tailored emails materially
outperform generic templates.)

---

## Support touch points

| Where | When | Channel |
|---|---|---|
| Pre-purchase | "Will this work for me?" | Email · WhatsApp · `/faq` |
| Verification | "Where's my installer?" | The 30-min auto reminder + WhatsApp |
| Install bug | "I'm stuck at step 3" | WhatsApp · screen-share offered free |
| Refund | "It's not for me" | `/refund` form |
| Renewal | n/a — lifetime license | n/a |

The founder's email and phone are visible on:
- The home page (Support section)
- The buy-india confirmation
- The installer wizard
- The dashboard's footer
- Every email the system sends

---

## How to take great screenshots for this guide

If you've never captured screenshots before, here's the no-frills method:

**Windows 11**
1. Press `Win + Shift + S`
2. Drag a rectangle around the area you want
3. Click the notification → click 💾 to save as PNG
4. Save into `docs/screenshots/` with the matching filename above

**Mac**
1. Press `Cmd + Shift + 4`
2. Drag the box
3. The file lands on your Desktop — rename and move into the folder

**Tips for great screenshots:**
- Crop tightly — don't include the browser chrome unless needed
- For dashboard shots, wait for it to be in full swing (47 matched, etc.)
- Use a clean Chrome profile (no extension icons cluttering the top)
- Capture at 1920×1080 minimum so they look crisp when embedded

Once the screenshots exist, they auto-appear below each `![…]` line
above and this becomes a fully-illustrated guide you can share with
investors, customers, and the press.

---

## TL;DR for sharing

> JobyBots = "An AI that does the entire job hunt for you,
> on your own laptop, for ₹2,999 one-time. Powered by Gemini.
> 7-day refund. Founder on WhatsApp."

Direct URLs to share:
- Live demo:   <https://jobybots.com/demo>
- Buy:         <https://jobybots.com/buy-india>
- FAQ:         <https://jobybots.com/faq>

Made with care. Last reviewed: May 2026.
