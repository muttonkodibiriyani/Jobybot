#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  JOBYBOT — Run one full cycle right now (macOS)
#  Equivalent of RUN_BOT_NOW.bat on Windows.
#  Takes 15–30 min. Window stays open so you can watch progress.
# ════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

export PYTHONIOENCODING=utf-8
export PYTHONUNBUFFERED=1

VENV_PY=".venv/bin/python"

if [ ! -x "$VENV_PY" ]; then
  echo "ERROR: Python virtual environment not found."
  echo "Run mac/Setup.command first by double-clicking it."
  read -rp "Press ENTER to exit..."
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  JOBYBOT — Starting one full cycle"
echo "  • Searches LinkedIn, Indeed, Bayt, GulfTalent, Naukri,"
echo "    RemoteOK + 40+ company career pages (Greenhouse, Lever,"
echo "    Workable, Ashby)."
echo "  • Gemini AI ranks each job vs your résumé"
echo "  • Sends personalized recruiter emails (up to 200/day cap)"
echo "  • Updates data/click_apply_inbox.html for Easy Apply jobs"
echo ""
echo "  Live dashboard will open in your browser. Watch progress there"
echo "  — it auto-refreshes every 15 seconds."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Pre-render & open the dashboard so the customer can watch live progress.
"$VENV_PY" scripts/open_dashboard.py || true

"$VENV_PY" jobybot.py run

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Cycle finished."
echo "  Tip: open data/click_apply_inbox.html for LinkedIn Easy Apply jobs"
echo "═══════════════════════════════════════════════════════════════"
read -rp "Press ENTER to close this window..."
