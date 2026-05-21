@echo off
REM ============================================================
REM  JOBYBOT - Build the 60-second showcase video
REM  Stitches all 20 storyboard frames (storyboard + install)
REM  into one 1080p MP4 using a portable ffmpeg (no install).
REM
REM  Output: releases\jobybots-60s.mp4
REM  Total time: ~60-90 seconds on a modern laptop.
REM ============================================================
title Jobybot - Build 60s Showcase Video
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=python"
)

echo.
echo Building 60-second showcase video from 20 storyboard frames...
echo.

"%PY%" scripts\build_video.py
if errorlevel 1 (
    echo.
    echo Build failed. See error above.
    pause
    exit /b 1
)

echo.
echo Opening the output folder so you can drag the video where you need it...
start "" "%CD%\releases"

echo.
echo Done. Press any key to close.
pause >nul
