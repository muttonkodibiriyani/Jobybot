# JobyBots — Customer Install Guide

Welcome! This guide gets you from "I just paid" to "the AI is searching jobs
on my laptop right now" in about **15 minutes**. No technical knowledge required.

---

## Before you start (one-time, 5 minutes)

You need three things ready on your laptop:

1. **Windows 10 or 11** (Mac/Linux supported too — see appendix).
2. **Python 3.10+** installed.
   - Don't have it? Download here → <https://www.python.org/downloads/>.
   - **IMPORTANT:** during install, tick the box that says **"Add Python to PATH"** at the bottom of the first screen.
3. **A Gmail account with App Password.**
   - Go to <https://myaccount.google.com/apppasswords>.
   - Sign in. Pick **Mail** + **Windows Computer**. Click **Generate**.
   - Copy the 16-character password. Save it — you'll paste it later.

That's everything you need.

---

## Step 1 — You've paid. What now?

After you pay ₹2,999 via UPI on <https://jobybots.com/buy-india> and upload your payment screenshot, the owner verifies it manually (within 30 minutes, 24×7).

You'll get an email with subject: **"Your JobyBots installer is ready"**.

The email contains:
- A download link to `Jobybot-Pro-Setup.zip` (~20 MB).
- Your unique customer ID (keep this — it's how we identify you for support).

## Step 2 — Download and extract

1. Click the download link in the email.
2. Save `Jobybot-Pro-Setup.zip` to your **Desktop** (or anywhere you like — Documents is also fine).
3. Right-click the zip file → **Extract All...** → **Extract**.
4. You now have a `Jobybot-Pro-Setup` folder with files inside.

## Step 3 — Run the installer

Open the extracted folder. Find the file called **`JOBYBOT.bat`**.

Double-click it.

A black command window opens. You'll see something like:

```
╔══════════════════════════════════════════════════╗
║              JobyBots — Setup Wizard            ║
║         Your AI Job Hunter, on your laptop      ║
╚══════════════════════════════════════════════════╝

[1/5] Creating Python virtual environment...
[2/5] Installing dependencies (this takes ~2 minutes)...
[3/5] Setting up config file...
```

**The wizard will ask you a few questions.** Type your answer and press Enter for each:

| Question | What to type |
|---|---|
| Your full name? | `Tharakeswara Reddy` (your actual name) |
| Your email? | `you@gmail.com` (the Gmail you'll send from) |
| Your phone? | `+91 7989931325` (include country code) |
| Your LinkedIn URL? | `https://linkedin.com/in/your-name` |
| Gmail App Password? | the 16-char password you generated above |
| Gemini API key? | (optional, see Step 4 — you can skip and add later) |

When done, you'll see:

```
✅ JobyBots installed successfully!
   Dashboard will open in your browser at http://localhost:8080
```

A browser tab opens showing your **JobyBots dashboard**. The AI starts searching jobs immediately.

## Step 4 — Add the FREE Gemini AI key (highly recommended, 2 minutes)

Without an AI key, JobyBots still works — it just uses keyword matching instead of smart Gemini-powered scoring. To unlock the full AI experience:

1. Open <https://aistudio.google.com/apikey> in your browser.
2. Sign in with your Google account.
3. Click the blue button **"Get API key"** → **"Create API key in new project"**.
4. Copy the long key (starts with `AIza...`).
5. In your JobyBots folder, open the file called **`.env`** in Notepad.
6. Find the line that says `GEMINI_API_KEY=` and paste your key after the `=`:
   ```
   GEMINI_API_KEY=AIzaSyB1234567890abcdefg...
   ```
7. Save (Ctrl+S). Close Notepad.
8. Double-click `RESTART_BOT.bat` to reload.

Now every job is AI-scored with Gemini. You'll see purple "✨ Gemini:" lines in the dashboard logs showing exactly what the AI is doing.

**Cost:** the Gemini free tier is 1,500 requests per day — plenty for 200 jobs scored daily. No credit card required.

## Step 5 — Drop your résumé in

In your JobyBots folder, find the file called `resume.pdf` (it's a placeholder).

Replace it with **your actual résumé** named exactly `resume.pdf`. Make sure it's a PDF (not Word).

The bot reads it on the next cycle and starts tailoring applications to your real profile.

## Step 6 — Watch the dashboard

Your dashboard is at <http://localhost:8080> — it should be open in your browser. You'll see:

- **Today's stats** — matched jobs, sent emails, bounces
- **AI Activity** — live log of every search and Gemini call
- **AI-ranked jobs** — sorted by match score, with one-click Apply buttons
- **Recent emails** — recruiters you've contacted

The bot runs every **30 minutes**, 24×7, as long as your laptop is on.

You'll also get a **daily summary email at 9 AM** with the top 25 AI-matched jobs of the previous 24 hours.

## Step 7 — Apply to jobs in one click

Each ranked job has an **Apply →** button. Click it.

The job opens in your browser. To pre-fill the application form:

1. **First time only:** drag the "JobyBots Apply Helper" bookmarklet from `bookmark.html` (in your JobyBots folder) to your browser's bookmarks bar.
2. On any application form, click the bookmark.
3. JobyBots fills your name, email, phone, LinkedIn, résumé text, work experience.
4. You review, tick the consent boxes, click **Submit**.

Works on LinkedIn Easy Apply, Indeed Quick Apply, Workday, Greenhouse, Lever, and most ATS systems.

---

## Daily routine (after install)

You don't have to do anything. Seriously.

- **Bot runs every 30 min** → finds jobs, scores them, emails recruiters.
- **9 AM email** → 25 ranked jobs to click-and-apply.
- **Dashboard always live** → check anytime.

You only intervene to:
- Click Apply on jobs you like
- Reply when recruiters respond to your emails

## Stopping / restarting

| What you want | What to double-click |
|---|---|
| Stop the bot | `STOP_BOT.bat` |
| Start it again | `RUN_BOT_NOW.bat` |
| Open the dashboard | `DASHBOARD.bat` |
| Check for bounces | `CHECK_BOUNCES.bat` |
| Update settings | open `.env` in Notepad |

## Common questions

### Will it use my CPU all day?

No. Each cycle takes ~30 seconds, every 30 minutes. The bot sleeps the rest of the time. You'll barely notice it.

### Can I close the dashboard tab?

Yes. The bot runs as a background process. Re-open the dashboard anytime by double-clicking `DASHBOARD.bat`.

### What if I shut down my laptop?

The bot stops. Next time you log in, double-click `RUN_BOT_NOW.bat` to resume.

For 24×7 operation, run it on a desktop PC, or set up auto-start with `START_AUTOSCHEDULE.bat`.

### Is my data safe?

Yes. **Nothing leaves your laptop except the emails the bot sends.** Your résumé, Gmail password, Gemini key, and all job data stay in your project folder — encrypted by Windows BitLocker if you have it enabled.

We never see your data. There's no telemetry. No cloud sync. No backdoor.

---

## Stuck? Real human support

Email: **tharakesh.iitp@gmail.com**  
Phone / WhatsApp: **+91 7989931325**  
Hours: Mon–Sat, 10:00–20:00 IST  
Response time: 1 hour during business hours

If you're stuck on install, we'll fix it on a screen-share call within 24 hours. No questions asked.

---

## Appendix — Mac / Linux

The bot runs identically on macOS and Linux — just use `install.sh` instead of `JOBYBOT.bat`. Open Terminal, `cd` to the extracted folder, then:

```bash
chmod +x install.sh
./install.sh
```

The same wizard runs. Everything else is identical.

---

**That's it. Welcome to JobyBots. The AI is on the case.** 🎯
