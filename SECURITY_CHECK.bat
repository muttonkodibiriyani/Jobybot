@echo off
title Jobybot Security Check
cd /d "%~dp0"
echo.
echo Locking .env and data folder permissions...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\secure_permissions.ps1"
echo.
echo Running security audit...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\security_audit.ps1"
echo.
pause
