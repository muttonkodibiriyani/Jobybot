@echo off
REM Double-click this to see today's bounce rate + discovery hit-rates.
REM Run it once a day. Goal: bounce rate trending toward zero.

cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
.\.venv\Scripts\python.exe scripts\deliverability_snapshot.py
echo.
echo ---
echo Snapshots are saved to data\snapshots\ so you can see the trend over time.
echo Press any key to close.
pause >nul
