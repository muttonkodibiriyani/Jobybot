@echo off
REM JobyBots Review Queue — opens a local web UI to review/edit/send each email
title JobyBots Review Queue
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

echo.
echo ============================================================
echo   JOBYBOTS REVIEW QUEUE
echo   Opening http://localhost:7868 in your browser...
echo   (close this window to shut the queue server down)
echo ============================================================
echo.

"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" queue
