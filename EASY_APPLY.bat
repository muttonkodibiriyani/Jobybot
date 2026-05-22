@echo off
REM JobyBots - LinkedIn Easy Apply (OPT-IN, dry-run by default)
REM
REM This script applies to LinkedIn jobs that support "Easy Apply".
REM
REM IMPORTANT: LinkedIn ToS forbids automation. Enabling this puts your
REM            LinkedIn account at risk. Read https://jobybots.com/easy-apply
REM            before you set EASY_APPLY_DRY_RUN=false in your .env.
title JobyBots - LinkedIn Easy Apply
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

echo.
echo ============================================================
echo   LINKEDIN EASY APPLY (visible Chromium window)
echo   Dry-run by default: fills the form, does NOT click Submit.
echo   To actually submit:  set EASY_APPLY_DRY_RUN=false in .env
echo                       OR run: jobybot.py easy-apply --no-dry-run
echo   Stop anytime:        close the Chromium window
echo ============================================================
echo.

"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" easy-apply

echo.
pause
