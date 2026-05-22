@echo off
REM Send 10 self-test emails to verify Gmail config + SMTP + resume attachment
title JobyBots — 10-email deliverability self-test
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

echo.
echo ============================================================
echo   10-EMAIL DELIVERABILITY SELF-TEST
echo   Sends 10 emails to YOUR own Gmail address.
echo   Open inbox afterwards and confirm all 10 arrive.
echo ============================================================
echo.

"%~dp0.venv\Scripts\python.exe" "%~dp0scripts\send_test_10.py"

echo.
pause
