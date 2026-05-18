# 🎯 Jobybot — Simple Guide for Anyone

**You don't need to know coding. Just follow these steps.**

This guide gets your job application bot running on your own computer in **15 minutes**. It will then automatically search for jobs and email recruiters every hour, every day, while you sleep.

---

## 📋 What you need before starting

| # | Item | Where to get it |
|---|------|-----------------|
| 1 | A Windows computer | Yours |
| 2 | Your CV as a PDF file | Save it from Word/Google Docs as PDF |
| 3 | A Gmail account | If you have Gmail, you have one. Use a personal one, not work. |
| 4 | A Gmail **App Password** (16 letters) | We make this in Step 4 below |
| 5 | Internet connection | Yours |

That's it. No credit card. No subscription. No software to buy.

---

## 🟢 STEP 1 — Download Jobybot to your computer

1. Open your web browser (Chrome / Edge / Firefox).
2. Go to: **https://github.com/muttonkodibiriyani/Jobybot**
3. Click the green **`< > Code`** button (top right of file list).
4. Click **`Download ZIP`**.
5. Open your **Downloads** folder.
6. Right-click `Jobybot-main.zip` → **Extract All** → choose a place you remember (like your Desktop or Documents).
7. You should now see a folder called **`Jobybot-main`**. Rename it to just **`Jobybot`** if you want (easier to type later).

✅ **Done. You now have the bot files.**

---

## 🟢 STEP 2 — Install Python (one-time only)

If you've never used Python, do this. If you already have Python 3.10 or newer, skip to Step 3.

1. Open: **https://www.python.org/downloads/**
2. Click the big yellow **`Download Python 3.12`** button.
3. Open the downloaded file (`python-3.12.x.exe`).
4. **⚠️ IMPORTANT:** At the bottom of the installer, **tick the box that says `Add python.exe to PATH`** before clicking Install. This is critical!
5. Click **`Install Now`**.
6. Wait until it says "Setup was successful" → click **`Close`**.

To verify Python installed:
- Press `Windows key + R` together
- Type `cmd` and press Enter
- A black window opens. Type:  `python --version`
- Press Enter. You should see something like: `Python 3.12.0`

✅ **Python is ready.**

---

## 🟢 STEP 3 — Put your CV PDF into the Jobybot folder

1. Find your CV PDF file (the one you'd send to a recruiter).
2. **Copy it** into your `Jobybot` folder.
3. **Rename it** to exactly: `resume.pdf`  *(all lowercase, no spaces)*

So inside your `Jobybot` folder you should now see `resume.pdf` next to `jobybot.py`, `README.md`, etc.

✅ **Your CV is ready to be attached to every email.**

---

## 🟢 STEP 4 — Get a Gmail App Password (the magic key)

Your normal Gmail password won't work for bots — Google blocks that for safety. You need a special 16-letter App Password. Takes 2 minutes.

### 4a. Turn on 2-Step Verification (if not already on)

1. Open: **https://myaccount.google.com/security**
2. Find **`2-Step Verification`** → click it.
3. Follow the prompts (uses your phone number). Once done, come back here.

### 4b. Create the App Password

1. Open: **https://myaccount.google.com/apppasswords**
2. In the box that says "App name", type:  `Jobybot`
3. Click **`Create`**.
4. Google shows you a 16-letter password like:  `abcd efgh ijkl mnop`
5. **Copy this password somewhere safe** (Notepad is fine). You will NOT see it again.

✅ **Save this password. You'll paste it into the bot in Step 5.**

---

## 🟢 STEP 5 — Fill in your details

1. Open your `Jobybot` folder.
2. Find the file called **`.env.example`** (it may show as just `.env`).
3. **Make a copy** of this file, in the same folder, and rename the copy to exactly:  `.env`  *(yes, starts with a dot, no extension)*
   
   💡 **Trick to rename to `.env` on Windows:**  In File Explorer, click View → tick **`File name extensions`**. Then right-click the file → Rename → type `.env` → press Enter. If Windows complains, just confirm "Yes".

4. Right-click your new `.env` file → **`Open with`** → **`Notepad`**.

5. Replace the example values with your real information. Here's what each line means:

```ini
USER_NAME="Your Full Name"                       ← Your real name
USER_EMAIL=you@gmail.com                         ← Your real email
USER_PHONE=+971501234567                         ← Your phone with country code
USER_LINKEDIN=https://linkedin.com/in/yourname   ← Your LinkedIn profile URL
USER_LOCATION="Dubai, UAE"                       ← Where you live
USER_VISA="UAE Resident Visa"                    ← Your work permit status
USER_NOTICE="1 month"                            ← When you can start
RESUME_PATH=./resume.pdf                         ← LEAVE THIS ALONE if you named your CV resume.pdf

USER_SUMMARY="Brief 1-2 sentence pitch about you. Mention years of experience, top skill, certifications."

GMAIL_ADDRESS=you@gmail.com                      ← Same as USER_EMAIL above
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop           ← The 16-letter password from Step 4b
```

6. Below that, you can change the **job titles you want** (one per line, separated by commas):
```ini
TARGET_TITLES="Product Manager,Senior Product Manager,Business Analyst,Project Manager"
```

7. And the **countries** you want to apply to:
```ini
PRIMARY_MARKET=UAE
SECONDARY_MARKETS="Singapore,Germany,Netherlands,Ireland,Canada,UK"
```

   Options for countries: `UAE`, `Singapore`, `Germany`, `Netherlands`, `Ireland`, `Canada`, `Australia`, `UK`

8. Press **`Ctrl + S`** to save. Close Notepad.

✅ **Your bot now knows who you are.**

---

## 🟢 STEP 6 — Install the bot (one click)

1. Open your `Jobybot` folder.
2. **Hold Shift and right-click** on an empty area inside the folder → click **`Open PowerShell window here`** (or `Open in Terminal`).
3. A blue/black window opens. Type this exact line and press Enter:

```
PowerShell -ExecutionPolicy Bypass -File install.ps1
```

4. The installer will:
   - Find your Python (✓)
   - Set up the bot's mini-Python environment (~1 minute)
   - Download all the libraries it needs (~1 minute)
   - Test your Gmail App Password works (you'll see "Gmail SMTP login OK ✓")

5. When it asks **"Run a full cycle now? (y/N)"** → type `y` and press Enter.
6. When it asks **"Install background scheduler? (y/N)"** → type `y` and press Enter.

✅ **Bot is now installed AND running.**

---

## 🟢 STEP 7 — Watch it work

After installation, the bot starts immediately:
- Searches LinkedIn, Indeed, NaukriGulf, Bayt, RemoteOK for matching jobs (~10 min)
- Scores each job against your CV
- Sends personalized emails with your CV attached to ~80 curated recruiters/employers (1 email per ~45 seconds)

### Check progress at any time

Open the `Jobybot` folder. You'll see a new sub-folder called `data` with:
- **`click_apply_inbox.html`** — Double-click to open in your browser. Auto-updates every 10 minutes. Shows all matched jobs with one-click apply buttons.
- **`jobybot.log`** — A text log of everything the bot is doing. Open with Notepad.
- **`jobybot.db`** — Database that remembers what jobs it found and who it emailed (so no duplicates).

### See stats anytime

1. Hold Shift + right-click inside the `Jobybot` folder → `Open in Terminal`.
2. Type:
```
.venv\Scripts\python.exe jobybot.py stats
```
3. Press Enter. You'll see something like:
```
  Jobs found     : 335
  Applied        : 0
  Emails sent    : 18
  Emails today   : 18/80
```

### Check your Gmail

Open your Gmail → **Sent** folder. You will see real emails going out to recruiters with subjects like:
> *"Senior PM / BA / Data Lead | Your Name | 7yrs | Dubai"*

Each one has **your CV attached** and a personalized cover note.

---

## 🟢 STEP 8 — Make it run forever (24/7)

The installer offered to do this in Step 6. If you said yes, **you're done — close everything.** Bot is now in your Windows Startup folder and will auto-launch every time you log into your PC.

To verify:
1. Press `Windows key + R`
2. Type: `shell:startup` and press Enter
3. You'll see **`Jobybot Scheduler`** shortcut in the folder that opens.

Now the bot:
- **Searches new jobs every 60 minutes**
- **Sends up to 80 emails per day** (Gmail's safe limit)
- **Sends 7-day follow-ups** to recruiters who didn't reply
- **Emails you a daily summary** at 9 AM
- **Restarts automatically** when you reboot your PC

---

## ❓ Quick Troubleshooting

### "Python is not recognized as a command"
→ Python wasn't added to PATH. Reinstall Python and **tick the `Add to PATH` box** during install.

### "Gmail SMTP login OK" never appears
→ Your Gmail App Password is wrong. Go back to Step 4b and create a new one. Paste it in `.env` exactly as shown (spaces don't matter, but the 16 letters must be correct).

### "Resume not found"
→ Your CV must be named exactly `resume.pdf` (all lowercase) and be in the `Jobybot` folder. OR change `RESUME_PATH=` in `.env` to the actual path of your PDF.

### Bot is running but no emails are going out
→ Check `data/jobybot.log` (open with Notepad). Search for `auth` or `error`. Common cause: Gmail App Password wrong.

### "I want to stop the bot"
1. Hold Shift + right-click inside the `Jobybot` folder → Open in Terminal
2. Type: `Get-Process python | Stop-Process -Force`
3. Press `Windows + R`, type `shell:startup`, press Enter
4. Delete the `Jobybot Scheduler` shortcut.

### "I want to change my settings later"
→ Open `.env` in Notepad, edit, save. Changes take effect on the next hourly cycle.

---

## 🤝 Useful commands cheat sheet

Open the Jobybot folder, Shift + right-click → Open in Terminal, then:

| What you want | Command |
|---------------|---------|
| See how many emails sent today | `.venv\Scripts\python.exe jobybot.py stats` |
| Verify everything is configured | `.venv\Scripts\python.exe jobybot.py doctor` |
| Run one cycle right now (don't wait an hour) | `.venv\Scripts\python.exe jobybot.py run` |
| Just search for new jobs (don't email) | `.venv\Scripts\python.exe jobybot.py search` |
| Just send emails (don't search) | `.venv\Scripts\python.exe jobybot.py email` |
| Open the live job inbox | Double-click `data\click_apply_inbox.html` |
| See the live log | Notepad → File → Open → `data\jobybot.log` |

---

## 📞 Need help?

- Read `docs/TROUBLESHOOTING.md` in the Jobybot folder
- Read `README.md` for the FAQ section
- Open an issue at: https://github.com/muttonkodibiriyani/Jobybot/issues

---

## 🙏 Pass it on

If this helped you land a job, **share this guide with someone else looking for work**. The bot is free forever for anyone.

> Just send them this link: **https://github.com/muttonkodibiriyani/Jobybot**

Good luck! 🍀
