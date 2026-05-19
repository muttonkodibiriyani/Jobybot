@echo off
REM ════════════════════════════════════════════════════════════════
REM  JOBYBOT — One-click: search jobs + send emails (one cycle)
REM  Double-click this file anytime you want a fresh run.
REM  Takes ~15-30 minutes. Window stays open so you can see progress.
REM ════════════════════════════════════════════════════════════════
title Jobybot - Run One Cycle (Search + Email)
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Python environment not found.
    echo Run install.ps1 first, or double-click JOBYBOT.bat and use setup options.
    pause
    exit /b 1
)

echo.
echo ==============================================================
echo   JOBYBOT - Starting one full cycle
echo   - Searches LinkedIn, Indeed, Bayt, Naukri, RemoteOK, etc.
echo   - Sends personalized emails (up to 200/day cap)
echo   - Updates your click-to-apply job inbox HTML
echo ==============================================================
echo.

".venv\Scripts\python.exe" jobybot.py run

echo.
echo ==============================================================
echo   Cycle finished. Press any key to close this window.
echo   Tip: Open data\click_apply_inbox.html for LinkedIn Easy Apply jobs.
echo ==============================================================
pause
