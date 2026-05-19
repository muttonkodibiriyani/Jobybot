@echo off
REM ════════════════════════════════════════════════════════════════
REM  JOBYBOT — SHARE THIS FILE WITH FRIENDS
REM  One double-click: install + secure + auto-schedule + start bot
REM
REM  Before sharing the folder:
REM    1. Download official ZIP from GitHub (do not share your .env!)
REM    2. Friend adds their own resume.pdf and fills .env when prompted
REM  https://github.com/muttonkodibiriyani/Jobybot
REM ════════════════════════════════════════════════════════════════
title Jobybot - Friend Setup (Install + Auto-Run)
cd /d "%~dp0"

echo.
echo   JOBYBOT - Friend installer
echo   Folder: %CD%
echo.

PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-friends.ps1"

echo.
pause
