#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  JOBYBOT — Control center menu for macOS
#  Equivalent of JOBYBOT.bat on Windows.
# ════════════════════════════════════════════════════════════════
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

YEL='\033[1;33m'
GRN='\033[0;32m'
CYN='\033[0;36m'
ORG='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

while true; do
  clear
  printf "${ORG}"
  printf "    ╔══════════════════════════════════════════════════════╗\n"
  printf "    ║                                                      ║\n"
  printf "    ║          ${YEL}JOBYBOTS — AI Job Hunter (macOS)${ORG}            ║\n"
  printf "    ║                                                      ║\n"
  printf "    ║          Tailored to your résumé • 24/7              ║\n"
  printf "    ║                                                      ║\n"
  printf "    ╚══════════════════════════════════════════════════════╝\n"
  printf "${NC}\n"
  echo "    What do you want to do?"
  echo ""
  printf "       ${CYN}1)${NC} Run one cycle right now      ${YEL}(takes 15-30 min)${NC}\n"
  printf "       ${CYN}2)${NC} Open the dashboard in browser\n"
  printf "       ${CYN}3)${NC} Start auto-schedule          ${YEL}(every 60 min, even if logged out)${NC}\n"
  printf "       ${CYN}4)${NC} Stop auto-schedule\n"
  printf "       ${CYN}5)${NC} Edit settings (.env)         ${YEL}(Gmail, Gemini key, etc.)${NC}\n"
  printf "       ${CYN}6)${NC} Re-install / Setup\n"
  printf "       ${CYN}7)${NC} View latest run log\n"
  printf "       ${CYN}8)${NC} Open Review Queue            ${YEL}(approve / edit / send each email)${NC}\n"
  printf "       ${CYN}9)${NC} Status snapshot              ${YEL}(scheduler + queue + today)${NC}\n"
  printf "      ${CYN}10)${NC} Full E2E audit               ${YEL}(every stage)${NC}\n"
  printf "       ${CYN}q)${NC} Quit\n"
  echo ""
  read -rp "    -> Your choice: " choice

  case "$choice" in
    1)  bash "$SCRIPT_DIR/RunBotNow.command" ;;
    2)  bash "$SCRIPT_DIR/Dashboard.command" ;;
    3)  bash "$SCRIPT_DIR/StartAutoSchedule.command" ;;
    4)  bash "$SCRIPT_DIR/StopBot.command" ;;
    5)  open -e .env 2>/dev/null || { echo "No .env yet. Run Setup first."; sleep 2; } ;;
    6)  bash "$SCRIPT_DIR/Setup.command" ;;
    7)
        if [ -f data/jobybot_launchd.log ]; then
          tail -n 60 data/jobybot_launchd.log
        else
          echo "No log yet -- start the auto-schedule first."
        fi
        read -rp "Press ENTER..."
        ;;
    8)  bash "$SCRIPT_DIR/ReviewQueue.command" ;;
    9)
        .venv/bin/python jobybot.py status
        read -rp "Press ENTER..."
        ;;
    10)
        .venv/bin/python scripts/_e2e_audit.py
        read -rp "Press ENTER..."
        ;;
    q|Q) clear; echo "Bye!"; exit 0 ;;
    *)  printf "${RED}Invalid choice.${NC}\n"; sleep 1 ;;
  esac
done
