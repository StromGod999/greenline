@echo off
title GreenPulse - Instant Shareable Link Generator
echo ===============================================================
echo      GreenPulse Mobile Store - Live Shareable Link Generator
echo ===============================================================
echo.
echo Make sure your Django server is running on port 8000!
echo (If not running, launch run_server.bat first in another window)
echo.
echo [1/2] Generating instant public HTTPS shareable URL via LocalTunnel...
echo.
npx -y localtunnel --port 8000
pause
