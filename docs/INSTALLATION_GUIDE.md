# JobyBots — Installation Guide (Windows + macOS)

> **You are not technical, and that is fine.** Every step below is a
> double-click or a single line you paste. Total time: **15 minutes**.

---

## What you need before you start

A laptop with **8 GB RAM** and **2 GB free disk**. Either:

- **Windows 10 or 11** (64-bit), or
- **macOS 12 Monterey or newer** — works on **Intel Macs** *and*
  **Apple Silicon** (M1 / M2 / M3 / M4)

Plus three things you'll create during setup (we'll walk through each):

1. A **Gmail App Password** — `myaccount.google.com/apppasswords` (2 minutes)
2. A **Gemini API key** — `aistudio.google.com/apikey` (30 seconds, free)
3. Your **résumé as `resume.pdf`** in the JobyBots folder

---

## Windows installation

### Step 1 — Install Python (one-time, only if you don't have it)

1. Open https://www.python.org/downloads/windows/
2. Click **"Download Python 3.12.x"**.
3. Run the installer. **Tick the box "Add python.exe to PATH"** at the
   bottom of the first screen. Click **Install Now**.
4. Close any open Command Prompt windows.

> **Already have Python?** Open PowerShell and type `python --version`. If
> it says 3.10 or newer, you can skip this step.

### Step 2 — Extract JobyBots

1. Save `JobyBots.zip` (the file we emailed you) to your Desktop.
2. Right-click → **Extract All…** → click **Extract**.
3. You should now have a folder called `JobyBots`.

### Step 3 — Run the installer

Double-click **`JOBYBOT.bat`** inside the JobyBots folder.

A black PowerShell window opens with a menu. Choose **`1) Setup`**. The
window will:

- Create a Python virtual environment (`.venv`)
- Install all the libraries the bot needs (~30 seconds)
- Open Notepad with your `.env` settings file (see Step 4)

### Step 4 — Fill in `.env`

Notepad shows lines like `USER_NAME="Your Full Name"`. Replace each
placeholder with your real value. The minimum required:

```ini
USER_NAME="Priya Sharma"
USER_EMAIL=priya@gmail.com
USER_PHONE=+971501234567
USER_LINKEDIN=https://linkedin.com/in/priya-sharma
USER_LOCATION="Dubai, UAE"
USER_SUMMARY="6+ years in fintech product, ex-Tabby. Looking for senior PM roles in MENA & Singapore."

GMAIL_ADDRESS=priya@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx     ← see Step 4a below
GEMINI_API_KEY=AIzaSy...                    ← see Step 4b below

TARGET_TITLES="Product Manager,Senior Product Manager,Group Product Manager"
PRIMARY_MARKET=UAE
SECONDARY_MARKETS="Singapore,UK,Ireland,Canada"
```

Save (`Ctrl+S`) and close Notepad.

#### Step 4a — How to get a Gmail App Password

1. Open **https://myaccount.google.com/apppasswords** in your browser.
   (You may need to enable 2-Step Verification first — Google walks you
   through it.)
2. Click **Create**. Name it `JobyBots`.
3. Google shows a 16-character password like `xxxx xxxx xxxx xxxx`.
4. **Copy that** and paste into `GMAIL_APP_PASSWORD=` in `.env`.
   (Do **not** use your real Gmail password — Google blocks that for SMTP.)

#### Step 4b — How to get a Gemini API key (free, ~30 seconds)

1. Open **https://aistudio.google.com/apikey**
2. Sign in with the same Google account.
3. Click **"Create API key"** → **"Create API key in new project"**.
4. Copy the key (it starts with `AIza...`).
5. Paste into `GEMINI_API_KEY=` in `.env`.

Free quota: **60 requests/minute, 1500/day** — comfortably enough for
JobyBots' daily volume.

### Step 5 — Add your résumé

Copy your résumé into the JobyBots folder and rename it to `resume.pdf`.

> **Don't have a PDF version?** In Word, click File → Save As → PDF.

### Step 6 — First run

In the open JobyBots menu (the one from Step 3), choose **`2) Run one
cycle right now`**. You'll see the bot:

- Read your résumé and pull out skills, titles, years
- Test Gmail login → "Gmail SMTP login OK ✓"
- Plan 540 search calls across 7 markets
- Discover 30–80 new jobs in 3 minutes
- Score each with Gemini (look for `[70]` `[65]` `[62]`...)
- Start sending personalised emails (30–120 s pause between sends — that's
  normal, it keeps Gmail happy)

The window stays open so you can watch progress.

### Step 7 — Schedule it to run forever (optional)

Back in the menu, choose **`3) Start auto-schedule`**. JobyBots installs
a Windows Task that runs `RUN_BOT_NOW.bat` every 30 minutes — even after
you log out, even after a reboot.

To stop the schedule later, run the menu and pick **`4) Stop bot`**.

---

## macOS installation

### Step 1 — Install Python (one-time)

The fastest path:

```bash
# Install Homebrew (only if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.12
brew install python@3.12
```

Or download the official `.pkg` installer from
https://www.python.org/downloads/macos/.

### Step 2 — Extract JobyBots

1. Save `JobyBots.zip` from our email.
2. Double-click it. macOS will extract a folder called `JobyBots`.
3. Move that folder to your Documents or Desktop.

### Step 3 — Allow `.command` scripts

Open Terminal, paste:

```bash
cd ~/Desktop/JobyBots          # or wherever you extracted it
chmod +x mac/*.command          # make all scripts executable
```

> If you see *"`.command` cannot be opened because the developer cannot
> be verified"* when you double-click later, right-click the file →
> **Open** → confirm. Or open **System Settings → Privacy & Security**
> and click **"Open Anyway"**. You only need to do this once per script.

### Step 4 — Run setup

Double-click **`mac/Setup.command`**. A Terminal window will:

- Find Python 3.10+
- Create a virtual environment (`.venv`)
- Install libraries
- Open TextEdit with `.env` for you to fill in

Fill in `.env` exactly as the Windows Step 4 above. Save with `Cmd+S`
and close (`Cmd+Q`).

### Step 5 — Add résumé

Drag your résumé into the JobyBots folder and rename it to `resume.pdf`.

### Step 6 — First run

Double-click **`mac/RunBotNow.command`**. Same behaviour as Windows
Step 6 — you'll see the search/score/send pipeline run live.

### Step 7 — Run automatically every 30 min

Double-click **`mac/StartAutoSchedule.command`**. This installs a macOS
`launchd` agent at `~/Library/LaunchAgents/com.jobybots.scheduler.plist`.
The bot will run every 30 minutes even after you log out.

To watch live logs:

```bash
tail -f data/jobybot_launchd.log
```

To stop the schedule: double-click `mac/StopBot.command`.

---

## Verifying it works (works on both OSes)

After your first cycle finishes (or while it's still running), open a
terminal in the JobyBots folder and run:

```powershell
# Windows
.venv\Scripts\python.exe scripts\cycle_status.py
```

```bash
# macOS
./.venv/bin/python scripts/cycle_status.py
```

You should see something like:

```
  ─── JobyBots — live cycle status ───
  Jobs in DB total:        628
  Jobs added today:        55
  Emails sent total:       295
  Emails sent today:       12
  Bad/bounced emails:      0
  Cached recruiter emails: 47

  ─── Top 10 jobs scraped today (by AI score) ───
  [ 92]  Senior Product Manager · Mobility   Careem       LinkedIn/Dubai
  [ 88]  Data Product Manager                talabat      Indeed/Riyadh
  [ 85]  AI Product Lead                     Razorpay     Naukri/Bengaluru
  …
```

To see the **live web dashboard** in your browser:

```powershell
# Windows
DASHBOARD.bat
```

```bash
# macOS
./mac/Dashboard.command
```

A browser tab opens at `http://localhost:8080` with sparklines, ranked
jobs, and live activity log.

---

## Common installation errors

| Error message | Fix |
|---|---|
| `python is not recognised as an internal or external command` | Re-run the Python installer and **tick "Add python.exe to PATH"** |
| `Could not find a version that satisfies the requirement ...` | You have Python 3.7 or 3.8 — upgrade to 3.10+ |
| `SMTPAuthenticationError: Username and Password not accepted` | You used your real Gmail password. Use an **App Password** instead (see Step 4a) |
| `ModuleNotFoundError: No module named pydantic` | The virtual env didn't activate. Re-run `JOBYBOT.bat` → 1) Setup |
| macOS `xcrun: error: invalid active developer path` | Open Terminal and run `xcode-select --install`, accept the prompt |
| macOS `.command cannot be opened because the developer cannot be verified` | Right-click the file → **Open**, or System Settings → Privacy → "Open Anyway" |
| `httpx.ConnectError: WinError 10013` | Your antivirus / firewall is blocking Python's outbound socket. Whitelist `.venv\Scripts\python.exe` |

---

## Folder map (after install)

```
JobyBots/
├── JOBYBOT.bat              ← Windows main menu (start here)
├── RUN_BOT_NOW.bat          ← run one cycle
├── DASHBOARD.bat            ← open browser dashboard
├── START_AUTOSCHEDULE.bat   ← every-30-min mode
├── mac/                     ← same scripts for macOS
│   ├── Setup.command
│   ├── JobyBot.command
│   └── …
├── .env                     ← your secrets (locked to your user)
├── resume.pdf               ← your résumé
├── data/                    ← created at runtime
│   ├── jobybot.db           ← all your jobs + emails (SQLite)
│   ├── jobybot.log
│   └── click_apply_inbox.html
└── docs/                    ← these guides
```

---

## After you're up and running

- Read **`docs/FEATURE_GUIDE.md`** for a tour of everything JobyBots can do.
- Read **`docs/CUSTOMER_TERMINAL_WALKTHROUGH.md`** for copy-paste commands
  to inspect, debug, and customise your runs.
- The **dashboard** (`DASHBOARD.bat`) shows everything live and updates
  every minute.
- Your **daily 9 AM digest email** is the easiest place to apply — just
  click the Apply buttons.

Welcome aboard. Now go get interviews.

— *JobyBots support*
- Email **tharakesh.iitp@gmail.com**
- WhatsApp **+91 7989931325**
- Mon–Sat 10:00–20:00 IST
