@echo off
REM Scan Gmail mailbox for delivery failures and mark bad recipients.
cd /d "%~dp0"
.\.venv\Scripts\python.exe scripts\check_bounces.py
echo.
pause
