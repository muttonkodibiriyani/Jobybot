@echo off
REM ─── Auto-launched at Windows login + by the daily 9:00 task ───
REM
REM Both triggers route through this file. The scheduler refuses to
REM start a duplicate (PID lockfile in data\scheduler.lock), so it is
REM SAFE to invoke this twice in a row. If the daemon is already
REM running, the second call exits in a few ms after printing a notice.
REM
REM See core\scheduler_lock.py for the lockfile mechanics.
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1
"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" schedule >> "%~dp0data\scheduler-stdout.log" 2>&1
