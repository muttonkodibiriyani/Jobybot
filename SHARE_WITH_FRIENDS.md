# Share Jobybot with a friend

Help someone else install Jobybot on their PC **without giving them your Gmail password**.

## What to send them

1. Link to GitHub: https://github.com/muttonkodibiriyani/Jobybot  
   **Or** send a ZIP of the project folder **after removing these from the ZIP:**

   - `.env` (your secrets)
   - `data/` (your job history)
   - `resume.pdf` (your CV)
   - `.venv/` (they will create their own)

2. Tell them to read **`HOW_TO_RUN.md`** or just double-click **`SETUP_FOR_FRIENDS.bat`**.

## What your friend does

1. Install Python 3.10+ from https://python.org (tick **Add to PATH**).
2. Put their CV as **`resume.pdf`** in the Jobybot folder.
3. Double-click **`SETUP_FOR_FRIENDS.bat`**.
4. Fill **`.env`** when Notepad opens (their name + **their** Gmail App Password).
5. Wait for setup to finish — bot auto-starts on login.

## What they use daily

| File | Purpose |
|------|---------|
| `JOBYBOT.bat` | Menu: start, stop, stats, emergency |
| `RUN_BOT_NOW.bat` | Search + email immediately |
| `docs/POWERSHELL_COMPLETE.md` | All PowerShell commands |

## Security reminder

- Never share your `.env` file.
- Each person must create their own Gmail App Password.
- Download only from the official GitHub repo.
