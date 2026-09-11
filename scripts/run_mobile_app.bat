@echo off
title Greenline Mobile App (Android & iOS Launcher)
color 0A

echo ============================================================
echo   Greenline Mobiles India - Mobile App Launcher
echo   Cross-Platform: Android APK / Simulator ^& iOS
echo ============================================================
echo.

cd /d "%~dp0..\mobile_app"

echo [1/3] Checking Node.js and NPM...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js LTS from https://nodejs.org/ to run the mobile app.
    pause
    exit /b 1
)

echo [2/3] Checking dependencies in mobile_app...
if not exist "node_modules\" (
    echo Installing React Native ^& Expo dependencies...
    call npm install
)

echo.
echo [3/3] Choose connection mode:
echo   [1] Local Network (Default - same Wi-Fi)
echo   [2] Tunnel Mode (Recommended if phone gives connection errors)
echo.
set /p choice="Enter choice [1 or 2, default=1]: "

if "%choice%"=="2" (
    echo Starting with Tunnel mode...
    call npx expo start --tunnel -c
) else (
    echo Starting in local mode with cache cleared...
    call npx expo start -c
)

pause
