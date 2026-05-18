#!/usr/bin/env bash
# Jobybot — macOS / Linux installer
# Usage:  bash install.sh

set -e
cd "$(dirname "$0")"

step() { echo; echo "═══ Step $1 — $2 ═══"; }

step 1 "Check Python 3.10+"
PY=""
for cmd in python3.12 python3.11 python3.10 python3 python; do
    if command -v "$cmd" >/dev/null 2>&1; then
        v=$("$cmd" --version 2>&1 | grep -oE "3\.[0-9]+")
        major=$(echo "$v" | cut -d. -f1)
        minor=$(echo "$v" | cut -d. -f2)
        if [ "$major" -eq 3 ] && [ "$minor" -ge 10 ]; then
            PY="$cmd"
            echo "✓ Found: Python $v ($cmd)"
            break
        fi
    fi
done

if [ -z "$PY" ]; then
    echo "Python 3.10+ not found."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Install via:  brew install python@3.12"
    else
        echo "Install via:  sudo apt install python3.12 python3.12-venv"
    fi
    exit 1
fi

step 2 "Create virtual environment"
if [ ! -d ".venv" ]; then
    "$PY" -m venv .venv
fi
PIP=".venv/bin/pip"
VENVPY=".venv/bin/python"
echo "✓ venv ready"

step 3 "Install dependencies"
"$VENVPY" -m pip install --upgrade pip --quiet
"$PIP" install -r requirements.txt --quiet
echo "✓ Dependencies installed"

step 4 "Create .env from template"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ .env created — EDIT IT WITH YOUR DETAILS:"
    echo "    nano .env   (or your editor)"
    read -p "Press ENTER when you've filled in .env" _
else
    echo "✓ .env already exists"
fi

step 5 "Ensure resume PDF is present"
RESUME=$(grep '^RESUME_PATH=' .env | cut -d= -f2- | tr -d '"' | tr -d "'")
if [ ! -f "$RESUME" ]; then
    echo "⚠ Resume not found at: $RESUME"
    echo "Place your CV PDF in this folder and update RESUME_PATH in .env"
    read -p "Press ENTER when ready" _
else
    echo "✓ Resume: $RESUME"
fi

step 6 "Run init"
"$VENVPY" jobybot.py init

step 7 "One cycle?"
read -p "Run a full cycle now? [y/N] " ANS
if [ "$ANS" = "y" ] || [ "$ANS" = "Y" ]; then
    "$VENVPY" jobybot.py run
fi

step 8 "Background scheduler"
read -p "Install background scheduler? [y/N] " ANS
if [ "$ANS" = "y" ] || [ "$ANS" = "Y" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS launchd
        PLIST="$HOME/Library/LaunchAgents/com.jobybot.scheduler.plist"
        cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.jobybot.scheduler</string>
  <key>ProgramArguments</key><array>
    <string>$(pwd)/.venv/bin/python</string>
    <string>$(pwd)/jobybot.py</string>
    <string>schedule</string>
  </array>
  <key>WorkingDirectory</key><string>$(pwd)</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$(pwd)/data/jobybot-stdout.log</string>
  <key>StandardErrorPath</key><string>$(pwd)/data/jobybot-stderr.log</string>
</dict>
</plist>
EOF
        launchctl unload "$PLIST" 2>/dev/null || true
        launchctl load   "$PLIST"
        echo "✓ launchd job installed: com.jobybot.scheduler"
        echo "Manage with:"
        echo "  launchctl unload $PLIST  — stop"
        echo "  launchctl load   $PLIST  — start"
    else
        # Linux systemd user unit
        UNIT="$HOME/.config/systemd/user/jobybot.service"
        mkdir -p "$(dirname "$UNIT")"
        cat > "$UNIT" <<EOF
[Unit]
Description=Jobybot scheduler
After=network.target

[Service]
Type=simple
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/.venv/bin/python $(pwd)/jobybot.py schedule
Restart=on-failure
RestartSec=30

[Install]
WantedBy=default.target
EOF
        systemctl --user daemon-reload
        systemctl --user enable --now jobybot.service
        loginctl enable-linger "$USER" 2>/dev/null || true
        echo "✓ systemd user service installed: jobybot.service"
        echo "Manage with:"
        echo "  systemctl --user status jobybot   — status"
        echo "  systemctl --user stop   jobybot   — pause"
        echo "  systemctl --user start  jobybot   — resume"
    fi
fi

echo
echo "═══ Install complete ═══"
echo "Live job inbox: $(pwd)/data/click_apply_inbox.html"
echo "Logs:           $(pwd)/data/jobybot.log"
echo
echo "Useful commands:"
echo "  .venv/bin/python jobybot.py stats     — see counts"
echo "  .venv/bin/python jobybot.py doctor    — check config"
echo "  .venv/bin/python jobybot.py run       — one cycle now"
