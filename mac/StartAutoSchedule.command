#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  JOBYBOT — Install a launchd agent so the bot runs automatically
#  every RUN_INTERVAL_MINUTES (from your .env). macOS equivalent of
#  Windows Task Scheduler. Runs even after you log out.
# ════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

YEL='\033[1;33m'
GRN='\033[0;32m'
CYN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

VENV_PY="$ROOT_DIR/.venv/bin/python"
if [ ! -x "$VENV_PY" ]; then
  printf "${RED}ERROR:${NC} Run mac/Setup.command first.\n"
  read -rp "Press ENTER..."
  exit 1
fi

# Read RUN_INTERVAL_MINUTES from .env (default 30)
INTERVAL_MIN=30
if [ -f .env ] && grep -q '^RUN_INTERVAL_MINUTES=' .env; then
  INTERVAL_MIN=$(grep '^RUN_INTERVAL_MINUTES=' .env | head -1 | cut -d= -f2 | tr -d ' "')
fi
INTERVAL_SEC=$((INTERVAL_MIN * 60))

PLIST_LABEL="com.jobybots.scheduler"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
LOG_OUT="$ROOT_DIR/data/jobybot_launchd.log"
LOG_ERR="$ROOT_DIR/data/jobybot_launchd.err.log"

mkdir -p "$ROOT_DIR/data"

printf "${CYN}═══ Installing launchd agent ═══${NC}\n"
printf "  Label:    %s\n" "$PLIST_LABEL"
printf "  Plist:    %s\n" "$PLIST_PATH"
printf "  Runs:     every %s min (%s sec)\n" "$INTERVAL_MIN" "$INTERVAL_SEC"
printf "  Logs:     %s\n\n" "$LOG_OUT"

# Stop any prior agent
launchctl unload "$PLIST_PATH" 2>/dev/null || true

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${VENV_PY}</string>
    <string>${ROOT_DIR}/jobybot.py</string>
    <string>run</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>StartInterval</key>
  <integer>${INTERVAL_SEC}</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_OUT}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_ERR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PYTHONIOENCODING</key>
    <string>utf-8</string>
    <key>PYTHONUNBUFFERED</key>
    <string>1</string>
  </dict>
</dict>
</plist>
EOF

launchctl load "$PLIST_PATH"

printf "${GRN}[OK]${NC} JobyBot will now run every %s minutes automatically.\n\n" "$INTERVAL_MIN"
echo "Useful macOS commands:"
echo "  • Watch live logs:  tail -f \"$LOG_OUT\""
echo "  • Stop scheduler:   launchctl unload \"$PLIST_PATH\""
echo "  • Start scheduler:  launchctl load \"$PLIST_PATH\""
echo ""
read -rp "Press ENTER to close..."
