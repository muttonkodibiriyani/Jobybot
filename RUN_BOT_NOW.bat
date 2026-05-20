@echo off
REM ════════════════════════════════════════════════════════════════
REM  JOBYBOT - One-click: search jobs + send emails (one cycle)
REM  Double-click this file anytime you want a fresh run.
REM  Takes ~15-30 minutes. Window stays open so you can see progress.
REM ════════════════════════════════════════════════════════════════
title Jobybot - Run One Cycle (Search + Email)
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Python environment not found.
    echo Run install.ps1 first, or double-click JOBYBOT.bat and use setup options.
    pause
    exit /b 1
)

echo.
echo ==============================================================
echo   JOBYBOT - Starting one full cycle
echo   - Searches LinkedIn, Indeed, Bayt, GulfTalent, Naukri,
echo     RemoteOK, plus 40+ company career pages (Greenhouse,
echo     Lever, Workable, Ashby).
echo   - Sends personalized emails (up to 200/day cap)
echo   - Updates your click-to-apply job inbox HTML
echo.
echo   Live dashboard will open in your browser in 5 seconds...
echo   Watch progress there - it refreshes every 15 seconds.
echo ==============================================================
echo.

REM Pre-render the dashboard and open it BEFORE the cycle starts so the
REM customer can watch the live banner update as the bot works.
".venv\Scripts\python.exe" scripts\open_dashboard.py

".venv\Scripts\python.exe" jobybot.py run

echo.
echo ==============================================================
echo   Cycle finished. Press any key to close this window.
echo   Tip: Open data\click_apply_inbox.html for LinkedIn Easy Apply jobs.
echo   Tip: DASHBOARD.bat opens the live dashboard anytime.
echo ==============================================================
pause
