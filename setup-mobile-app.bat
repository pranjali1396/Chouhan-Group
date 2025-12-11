@echo off
REM Mobile App Setup Script for Chouhan Housing CRM (Windows)
REM This script sets up Capacitor for Android development

echo.
echo 🚀 Setting up mobile app with Capacitor...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✅ Node.js found
node --version
echo.

REM Install Capacitor dependencies
echo 📦 Installing Capacitor dependencies...
call npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

REM Build the web app
echo.
echo 🔨 Building web app...
call npm run build

REM Initialize Capacitor (if not already initialized)
if not exist "capacitor.config.ts" (
    echo.
    echo ⚙️  Initializing Capacitor...
    echo When prompted, enter:
    echo   - App name: Chouhan Housing CRM
    echo   - App ID: com.chouhanhousing.crm
    echo   - Web dir: dist
    echo.
    call npx cap init
) else (
    echo ✅ Capacitor already initialized
)

REM Add Android platform
if not exist "android" (
    echo.
    echo 📱 Adding Android platform...
    call npx cap add android
) else (
    echo ✅ Android platform already added
)

REM Sync
echo.
echo 🔄 Syncing to Android...
call npx cap sync android

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Install Android Studio if you haven't: https://developer.android.com/studio
echo 2. Open the project in Android Studio:
echo    npx cap open android
echo 3. Wait for Gradle sync to complete
echo 4. Click Run (▶️) to build and run on emulator/device
echo.
echo 📚 For detailed instructions, see: MOBILE_APP_SETUP.md
echo.
pause

