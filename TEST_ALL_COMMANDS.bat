@echo off
title Jobybot - Test All PowerShell Commands
cd /d "%~dp0"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0TEST_ALL_COMMANDS.ps1"
pause
