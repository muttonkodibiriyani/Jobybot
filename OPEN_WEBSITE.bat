@echo off
title Jobybot Website
cd /d "%~dp0website"

if not exist "node_modules\" (
    echo Installing website dependencies...
    call npm install
)

echo.
echo Starting Jobybot website...
echo   Open in browser: http://localhost:3000
echo   Keep this window OPEN while you use the site.
echo   Press Ctrl+C to stop the server.
echo.

start "" "http://localhost:3000"
npm run dev
