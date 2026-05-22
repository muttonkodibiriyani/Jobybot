#!/usr/bin/env bash
# JobyBots — LinkedIn Easy Apply (OPT-IN, dry-run by default)
#
# IMPORTANT: LinkedIn ToS forbids automation. Read
#            https://jobybots.com/easy-apply before flipping
#            EASY_APPLY_DRY_RUN=false.
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

if [ ! -d ".venv" ]; then
  echo "No .venv found — run mac/Setup.command first."
  read -rp "Press ENTER to close..."
  exit 1
fi

clear
echo ""
echo "============================================================"
echo "  LINKEDIN EASY APPLY (visible Chromium window)"
echo "  Dry-run by default. To actually submit:"
echo "    .venv/bin/python jobybot.py easy-apply --no-dry-run"
echo "  Stop anytime: close the Chromium window"
echo "============================================================"
echo ""

PYTHONIOENCODING=utf-8 .venv/bin/python jobybot.py easy-apply
