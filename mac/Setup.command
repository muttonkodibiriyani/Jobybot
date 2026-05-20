#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  JOBYBOT — One-click installer for macOS (Intel + Apple Silicon)
#  Just double-click this file. Terminal will open.
#  Equivalent of SETUP_FOR_FRIENDS.bat on Windows.
# ════════════════════════════════════════════════════════════════
set -e

# cd into the JobyBot root (one level up from /mac)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

YEL='\033[1;33m'
GRN='\033[0;32m'
CYN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

clear
printf "${YEL}\n"
printf "  ╔════════════════════════════════════════════════════════════╗\n"
printf "  ║   JOBYBOT  —  macOS installer                              ║\n"
printf "  ║   Installs Python deps, sets up Gmail, runs first cycle.   ║\n"
printf "  ╚════════════════════════════════════════════════════════════╝\n"
printf "${NC}\n"
printf "  Folder: ${CYN}%s${NC}\n\n" "$ROOT_DIR"

# ─── 1. Find Python 3.10+ ────────────────────────────────────────
printf "${CYN}═══ Step 1 — Locate Python 3.10+ ═══${NC}\n"
PYTHON=""
for cmd in python3 python3.12 python3.11 python3.10 python; do
  if command -v "$cmd" >/dev/null 2>&1; then
    VER=$("$cmd" --version 2>&1 | awk '{print $2}')
    MAJOR=$(echo "$VER" | cut -d. -f1)
    MINOR=$(echo "$VER" | cut -d. -f2)
    if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
      PYTHON="$cmd"
      printf "${GRN}[OK]${NC} Found %s (%s)\n" "$cmd" "$VER"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  printf "${RED}[ERROR]${NC} Python 3.10+ not found.\n\n"
  echo "Install it one of these ways (pick one):"
  echo "  1. Homebrew:   brew install python@3.12"
  echo "  2. Official:   https://www.python.org/downloads/macos/"
  echo "  3. App Store:  search for 'Python 3'"
  echo ""
  echo "After installing, double-click Setup.command again."
  read -rp "Press ENTER to exit..."
  exit 1
fi

# ─── 2. Create virtual environment ───────────────────────────────
printf "\n${CYN}═══ Step 2 — Create virtual environment ═══${NC}\n"
if [ ! -d ".venv" ]; then
  "$PYTHON" -m venv .venv
  printf "${GRN}[OK]${NC} Created .venv\n"
else
  printf "${GRN}[OK]${NC} .venv already exists\n"
fi

VENV_PY=".venv/bin/python"
VENV_PIP=".venv/bin/pip"

# ─── 3. Install dependencies ─────────────────────────────────────
printf "\n${CYN}═══ Step 3 — Install Python libraries ═══${NC}\n"
"$VENV_PY" -m pip install --upgrade pip --quiet
"$VENV_PIP" install -r python-deps.txt --quiet
printf "${GRN}[OK]${NC} All libraries installed\n"

# ─── 4. Configure .env ───────────────────────────────────────────
printf "\n${CYN}═══ Step 4 — Your settings (.env) ═══${NC}\n"
if [ ! -f ".env" ]; then
  cp .env.example .env
  printf "${YEL}\nIMPORTANT:${NC} TextEdit will open .env in 3 seconds.\n"
  echo "  Fill in these (case-sensitive):"
  echo "    USER_NAME, USER_EMAIL, USER_PHONE, USER_LINKEDIN"
  echo "    GMAIL_ADDRESS, GMAIL_APP_PASSWORD"
  echo "    GEMINI_API_KEY"
  echo ""
  echo "  Then save (Cmd+S) and close TextEdit (Cmd+Q)."
  sleep 3
  open -e -W .env
else
  printf "${GRN}[OK]${NC} .env already exists\n"
fi

# ─── 5. Resume PDF check ─────────────────────────────────────────
printf "\n${CYN}═══ Step 5 — Resume PDF check ═══${NC}\n"
if ls *.pdf >/dev/null 2>&1; then
  PDF=$(ls *.pdf | head -1)
  printf "${GRN}[OK]${NC} Found: %s\n" "$PDF"
else
  printf "${YEL}[!]${NC} No PDF resume in folder. Add resume.pdf before emails will attach.\n"
fi

# ─── 6. Lock down secret files (.env, *.pdf) ────────────────────
printf "\n${CYN}═══ Step 6 — Secure your secret files ═══${NC}\n"
chmod 600 .env 2>/dev/null || true
chmod 600 *.pdf 2>/dev/null || true
printf "${GRN}[OK]${NC} .env and resume.pdf are now owner-only (chmod 600)\n"

# ─── 7. Health check ─────────────────────────────────────────────
printf "\n${CYN}═══ Step 7 — Health check + Gmail test ═══${NC}\n"
"$VENV_PY" jobybot.py init || true

# ─── 8. Done ─────────────────────────────────────────────────────
printf "\n${GRN}\n"
printf "  ╔════════════════════════════════════════════════════════════╗\n"
printf "  ║   SETUP COMPLETE                                           ║\n"
printf "  ╚════════════════════════════════════════════════════════════╝\n"
printf "${NC}\n"
echo "  Next steps:"
echo "    • Double-click mac/RunBotNow.command    →  one full cycle now"
echo "    • Double-click mac/Dashboard.command    →  open browser dashboard"
echo "    • Double-click mac/StartAutoSchedule.command  →  run every 30 min"
echo ""
read -rp "Press ENTER to close this window..."
