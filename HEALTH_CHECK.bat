@echo off
REM ════════════════════════════════════════════════════════════════
REM  HEALTH_CHECK.bat — one-click "is my bot working?" check
REM  Double-click this and you'll see every aspect of the bot's
REM  current state without typing a single command.
REM ════════════════════════════════════════════════════════════════
title Jobybot — Full Health Check
cd /d "%~dp0"
echo.
echo ============================================================
echo  JOBYBOT HEALTH CHECK
echo ============================================================
echo.
echo Working directory: %CD%
echo.

REM ── 1. doctor (config + credentials) ─────────────────────────
echo === 1. Configuration check ===
".venv\Scripts\python.exe" jobybot.py doctor
echo.

REM ── 2. funnel (where jobs are stuck) ─────────────────────────
echo === 2. Funnel state (where every job stands) ===
".venv\Scripts\python.exe" jobybot.py funnel
echo.

REM ── 3. status (scheduler + daily counts) ─────────────────────
echo === 3. Today's activity ===
".venv\Scripts\python.exe" jobybot.py status
echo.

REM ── 4. stats (lifetime) ─────────────────────────────────────
echo === 4. Lifetime stats ===
".venv\Scripts\python.exe" jobybot.py stats
echo.

echo ============================================================
echo  HEALTH CHECK COMPLETE
echo ============================================================
echo.
echo If you saw any errors above, run these in order to fix them:
echo.
echo   .\.venv\Scripts\python.exe jobybot.py doctor
echo   .\.venv\Scripts\python.exe jobybot.py login-linkedin
echo   .\.venv\Scripts\python.exe jobybot.py run
echo.
pause
