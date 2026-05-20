#!/usr/bin/env python3
"""
Build a customer-ready installer package.

Run this script anytime you want to refresh the `customer-package/JobyBots/`
folder. The output is a clean, lean copy of just the files a paying
customer needs — no .git, no website/, no .next, no .venv, no logs.

Usage:
    py -3 scripts/build_customer_package.py
    py -3 scripts/build_customer_package.py --zip   # also makes JobyBots.zip

After it runs:
    customer-package/JobyBots/          ← the folder you share
    customer-package/JobyBots.zip       ← single-file delivery (with --zip)
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "customer-package" / "JobyBots"
ZIP_PATH = ROOT / "customer-package" / "JobyBots.zip"


# Files & folders that go into the customer package.
INCLUDE_FILES = [
    # Top-level Python entrypoints
    "jobybot.py",
    "config.py",
    "python-deps.txt",
    ".env.example",
    # Windows one-click .bat launchers
    "JOBYBOT.bat",
    "RUN_BOT_NOW.bat",
    "DASHBOARD.bat",
    "START_AUTOSCHEDULE.bat",
    "SETUP_FOR_FRIENDS.bat",
    "CHECK_BOUNCES.bat",
    "SECURITY_CHECK.bat",
    "_run_scheduler.bat",
    # Windows PowerShell installer + menu
    "install-friends.ps1",
    "install.ps1",
    "jobybot-menu.ps1",
]

INCLUDE_DIRS = [
    "core",          # bot Python modules
    "sources",       # job-board scrapers (LinkedIn, Bayt, GulfTalent, Company ATS)
    "scripts",       # python helpers (dashboard opener, bookmarklet, etc.)
    "powershell",    # PowerShell command library (Windows)
    "mac",           # macOS .command scripts
    "docs",          # customer-facing docs (install guide, architecture, security, mission)
    "templates",     # email + cover-letter templates
    "markets",       # per-country recruiter contact lists + GDPR flags
]

# Paths we never include in the customer package.
EXCLUDE_PATTERNS = {
    "__pycache__",
    ".git",
    ".github",
    ".next",
    "node_modules",
    ".venv",
    "venv",
    ".vercel",
    "website",
    "data",
    "customer-package",
    ".env",                  # never ship the owner's secrets
    "ADMIN_ACCESS.txt",      # never ship the owner's admin password
    "*.pdf",                 # never ship the owner's résumé
    "*.log",
    "*.db",
    "*.sqlite",
    "*.pyc",
}


def should_exclude(name: str) -> bool:
    """Return True if a file/dir name matches an exclusion pattern."""
    for pat in EXCLUDE_PATTERNS:
        if pat.startswith("*"):
            if name.endswith(pat[1:]):
                return True
        elif name == pat:
            return True
    return False


def copy_path(src: Path, dst: Path) -> int:
    """Copy a file or directory tree honoring EXCLUDE_PATTERNS. Returns file count."""
    if not src.exists():
        print(f"  [skip]  {src.relative_to(ROOT)}  (not found)")
        return 0

    if src.is_file():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        return 1

    count = 0
    for item in src.rglob("*"):
        rel = item.relative_to(src)
        if any(should_exclude(part) for part in rel.parts):
            continue
        target = dst / rel
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
            count += 1
    return count


def write_readme(out: Path) -> None:
    """Write a friendly README at the top of the customer package."""
    body = """\
# Welcome to JobyBots

Thank you for your purchase! This folder contains everything you need to
run JobyBots on your computer. Your résumé and Gmail password **never
leave your laptop** — JobyBots is 100% local.

## Pick your operating system

### 🪟 Windows users
Just double-click **`JOBYBOT.bat`**. The menu walks you through:
1. Install Python packages (one-time)
2. Fill in your `.env` settings
3. Run your first job-search cycle

### 🍎 Mac users (Intel + Apple Silicon)
Just double-click **`mac/Setup.command`** to install, then use the
menu at **`mac/JobyBot.command`**.

> First-time on macOS you may see a security prompt. Right-click → Open,
> or go to System Settings → Privacy & Security → "Open Anyway". You
> only need to do this once per script.

## What you need to fill in

When the setup runs it will open `.env` in your text editor. Fill in:

| Setting | Where to get it |
|---|---|
| `USER_NAME`, `USER_EMAIL`, `USER_PHONE`, `USER_LINKEDIN` | Your details |
| `GMAIL_ADDRESS` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | https://myaccount.google.com/apppasswords (NOT your password) |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (free, takes 30 sec) |

Then drop your résumé as **`resume.pdf`** into this folder.

That's it. The bot will start searching jobs every 30 minutes, score them
with Gemini AI, and send personalized emails to recruiters.

## Daily use

| You want to… | Windows | macOS |
|---|---|---|
| See the menu | Double-click `JOBYBOT.bat` | Double-click `mac/JobyBot.command` |
| Run a cycle now | `RUN_BOT_NOW.bat` | `mac/RunBotNow.command` |
| Open dashboard | `DASHBOARD.bat` | `mac/Dashboard.command` |
| Run every 30 min automatically | `START_AUTOSCHEDULE.bat` | `mac/StartAutoSchedule.command` |
| Stop the bot | `JOBYBOT.bat` → stop | `mac/StopBot.command` |
| Edit settings | Edit `.env` in Notepad | Edit `.env` in TextEdit |

## Read these first (in the `docs/` folder)

| File | When to read |
|---|---|
| `docs/MISSION.md` | Why JobyBots exists (the story behind it) |
| `docs/INSTALLATION_GUIDE.md` | The full step-by-step install for Win + Mac |
| `docs/FEATURE_GUIDE.md` | Every feature you can use (15 sections) |
| `docs/CUSTOMER_TERMINAL_WALKTHROUGH.md` | Copy-paste commands that prove the bot works end-to-end |
| `docs/POWERSHELL_SCRIPTS.md` | Every .bat / .ps1 / .command documented |
| `docs/ARCHITECTURE.md` | System + AI architecture (for the curious) |
| `docs/SECURITY.md` | Threat model + what we do to protect your data |

## Help

- FAQ:        https://jobybots.com/faq
- Email:      tharakesh.iitp@gmail.com
- WhatsApp:   +91 7989931325
- Support hours: Mon–Sat, 10:00 – 20:00 IST

## Refund

7-day money-back guarantee, no questions asked. Submit the form at
https://jobybots.com/refund and refund hits your UPI within 48 hours.

---
JobyBots · A product by Tharakeswara Reddy · Lifetime license
"""
    (out / "README.md").write_text(body, encoding="utf-8")


def write_install_quickstart(out: Path) -> None:
    """One-page quickstart customers can print and put next to the laptop."""
    body = """\
JOBYBOTS — QUICK START
======================

WINDOWS
  1. Double-click  JOBYBOT.bat
  2. Choose       1) Setup
  3. Fill in       .env  (Notepad will open)
  4. Add           resume.pdf  to this folder
  5. Choose       2) Run one cycle now

macOS
  1. Double-click  mac/Setup.command
  2. If macOS warns you, right-click → Open
  3. Fill in       .env  (TextEdit will open)
  4. Add           resume.pdf  to the JobyBots folder
  5. Double-click  mac/RunBotNow.command

WHAT TO FILL IN .env
  USER_NAME, USER_EMAIL, USER_PHONE, USER_LINKEDIN
  GMAIL_ADDRESS         → your gmail
  GMAIL_APP_PASSWORD    → https://myaccount.google.com/apppasswords
  GEMINI_API_KEY        → https://aistudio.google.com/apikey

ANY ISSUE?
  Email:    tharakesh.iitp@gmail.com
  WhatsApp: +91 7989931325
  Replies within 1 hour, Mon–Sat 10:00-20:00 IST

YOUR DATA IS YOURS
  • .env is automatically locked to your user account.
  • Your résumé and Gmail password never leave your machine.
  • The website at jobybots.com only handles your initial payment.
"""
    (out / "QUICKSTART.txt").write_text(body, encoding="utf-8")


def write_version_stamp(out: Path) -> None:
    """Tiny VERSION file with a build hash so support can identify what build a customer has."""
    h = hashlib.sha256()
    for path in sorted(out.rglob("*")):
        if path.is_file():
            h.update(path.read_bytes())
    short = h.hexdigest()[:12]
    from datetime import datetime, timezone

    (out / "VERSION.txt").write_text(
        f"JobyBots customer package\n"
        f"Build:  {short}\n"
        f"Built:  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC\n",
        encoding="utf-8",
    )
    return short


def make_zip(folder: Path, zip_path: Path) -> None:
    """Zip the customer folder, preserving file modes (so .command scripts stay executable)."""
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(folder.rglob("*")):
            arc = path.relative_to(folder.parent)
            if path.is_file():
                info = zipfile.ZipInfo.from_file(path, arc.as_posix())
                # Mark .command and .sh scripts as +x so macOS will execute them
                if path.suffix in (".command", ".sh"):
                    info.external_attr = 0o755 << 16
                else:
                    info.external_attr = 0o644 << 16
                zf.writestr(info, path.read_bytes())


def main() -> int:
    ap = argparse.ArgumentParser(description="Build the JobyBots customer package")
    ap.add_argument("--zip", action="store_true", help="Also produce JobyBots.zip")
    args = ap.parse_args()

    if OUTDIR.exists():
        print(f"  Removing previous output: {OUTDIR.relative_to(ROOT)}")
        shutil.rmtree(OUTDIR)
    OUTDIR.mkdir(parents=True, exist_ok=True)

    total = 0

    print("\n  Copying files…")
    for name in INCLUDE_FILES:
        total += copy_path(ROOT / name, OUTDIR / name)
        print(f"    + {name}")

    print("\n  Copying folders…")
    for name in INCLUDE_DIRS:
        before = total
        total += copy_path(ROOT / name, OUTDIR / name)
        print(f"    + {name}/  ({total - before} files)")

    # Pre-create the empty 'data' dir so the bot can write logs/db immediately
    (OUTDIR / "data").mkdir(exist_ok=True)
    (OUTDIR / "data" / ".gitkeep").touch()

    print("\n  Writing README + QUICKSTART…")
    write_readme(OUTDIR)
    write_install_quickstart(OUTDIR)

    build = write_version_stamp(OUTDIR)

    size = sum(f.stat().st_size for f in OUTDIR.rglob("*") if f.is_file())
    print("\n" + "=" * 60)
    print(f"  ✓ Customer package built")
    print(f"    Folder: {OUTDIR.relative_to(ROOT)}")
    print(f"    Files:  {total}")
    print(f"    Size:   {size / 1024:.1f} KB")
    print(f"    Build:  {build}")
    print("=" * 60)

    if args.zip:
        print("\n  Zipping…")
        make_zip(OUTDIR, ZIP_PATH)
        zsize = ZIP_PATH.stat().st_size
        print(f"  ✓ Zip ready: {ZIP_PATH.relative_to(ROOT)}  ({zsize / 1024:.1f} KB)")
        print("    Email this single .zip to the customer after payment.")

    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
