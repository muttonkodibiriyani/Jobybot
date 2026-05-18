@echo off
REM ════════════════════════════════════════════════════════════════
REM  JOBYBOT — One-click launcher
REM  Just double-click this file to open the Jobybot control menu.
REM ════════════════════════════════════════════════════════════════
title Jobybot Control Center
cd /d "%~dp0"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0jobybot-menu.ps1"
pause
