@echo off
REM Start Jobybot 24/7 + enable auto-start on Windows login
title Jobybot - Start Auto-Schedule
cd /d "%~dp0"

echo.
echo ============================================================
echo   STARTING JOBYBOT (hourly search + email in background)
echo ============================================================
echo.

PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\13-Stop-Bot.ps1"
timeout /t 3 /nobreak >nul

PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\enable_autostart.ps1"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\15-Start-Background.ps1"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\01-Is-Running.ps1"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\02-Stats.ps1"

echo.
echo Bot is scheduled. Interval is set in .env as RUN_INTERVAL_MINUTES
echo   60 = every hour   |   30 = every 30 minutes
echo.
echo To run search+email RIGHT NOW, double-click RUN_BOT_NOW.bat
echo To apply on LinkedIn jobs, open: data\click_apply_inbox.html
echo.
pause
