@echo off
REM ════════════════════════════════════════════════════════════════
REM  JOBYBOT — One-click: build a customer-shareable installer .zip
REM  Output: customer-package\JobyBots.zip
REM  Email this single .zip to a customer after they pay.
REM ════════════════════════════════════════════════════════════════
title Jobybot - Build Customer Package
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" scripts\build_customer_package.py --zip
) else (
  py -3 scripts\build_customer_package.py --zip
)

echo.
echo ============================================================
echo  When you sell to a customer, attach:
echo    customer-package\JobyBots.zip
echo  to your approval email. It contains everything they need.
echo ============================================================
pause
