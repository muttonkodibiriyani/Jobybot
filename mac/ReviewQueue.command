#!/usr/bin/env bash
# JobyBots Review Queue (macOS) — local web UI to review/edit/send each email
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
echo "  JOBYBOTS REVIEW QUEUE"
echo "  Opening http://localhost:7868 in your browser..."
echo "  (close this window to shut the queue server down)"
echo "============================================================"
echo ""

PYTHONIOENCODING=utf-8 .venv/bin/python jobybot.py queue
