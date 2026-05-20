#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  JOBYBOT — Stop the auto-schedule on macOS
#  Removes the launchd agent. Bot stops running automatically.
# ════════════════════════════════════════════════════════════════
set -e

PLIST_LABEL="com.jobybots.scheduler"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"

if [ -f "$PLIST_PATH" ]; then
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "[OK] JobyBot scheduler stopped and removed."
else
  echo "[INFO] No scheduler is currently installed."
fi
echo ""

# Also kill any in-flight python jobybot.py processes
PIDS=$(pgrep -f "jobybot.py" || true)
if [ -n "$PIDS" ]; then
  echo "Killing in-flight bot processes: $PIDS"
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
fi

read -rp "Press ENTER to close..."
