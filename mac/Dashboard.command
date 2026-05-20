#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  JOBYBOT — Open the live dashboard in your browser (macOS)
#  Equivalent of DASHBOARD.bat on Windows.
# ════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

VENV_PY=".venv/bin/python"

if [ ! -x "$VENV_PY" ]; then
  echo "ERROR: Python virtual environment not found."
  echo "Run mac/Setup.command first by double-clicking it."
  read -rp "Press ENTER to exit..."
  exit 1
fi

"$VENV_PY" scripts/open_dashboard.py
