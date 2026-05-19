@echo off
REM Open the Jobybot live dashboard in your browser.
cd /d "%~dp0"
.\.venv\Scripts\python.exe scripts\open_dashboard.py
if errorlevel 1 (
  echo.
  echo Could not open dashboard. Run: SETUP_FOR_FRIENDS.bat first.
  pause
)
