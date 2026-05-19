@echo off
REM ════════════════════════════════════════════════════════════════
REM  JOBYBOT — Sync this folder with GitHub (one click)
REM  Pulls latest code/docs from GitHub, then pushes your local changes.
REM  Requires Git installed: https://git-scm.com/download/win
REM ════════════════════════════════════════════════════════════════
title Jobybot - Sync with GitHub
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed.
    echo Download from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo ==============================================================
echo   JOBYBOT - GitHub sync
echo   Folder: %CD%
echo ==============================================================
echo.

echo [1/3] Fetching latest from GitHub...
git fetch origin
if errorlevel 1 (
    echo WARNING: fetch failed. Check internet or remote URL.
)

echo.
echo [2/3] Pulling latest changes (keeps your .env and data/)...
git pull origin main 2>nul
if errorlevel 1 git pull origin master 2>nul
if errorlevel 1 (
    echo NOTE: pull had conflicts or no remote branch. See message above.
)

echo.
echo [3/3] Pushing local commits (if any)...
git add -A
git status
echo.
set /p PUSH="Push changes to GitHub now? (Y/N): "
if /i "%PUSH%"=="Y" (
    git commit -m "Jobybot local sync" 2>nul
    git push origin HEAD 2>nul
    if errorlevel 1 git push origin main 2>nul
    if errorlevel 1 git push origin master 2>nul
)

echo.
echo Done. Your .env, resume.pdf, and data\ folder are NOT uploaded
echo unless you committed them on purpose - they stay on your PC.
echo.
pause
