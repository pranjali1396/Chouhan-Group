#!/bin/bash

# Mobile App Setup Script for Chouhan Housing CRM
# This script sets up Capacitor for Android development

echo "🚀 Setting up mobile app with Capacitor..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install Capacitor dependencies
echo "📦 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Build the web app
echo ""
echo "🔨 Building web app..."
npm run build

# Initialize Capacitor (if not already initialized)
if [ ! -f "capacitor.config.ts" ]; then
    echo ""
    echo "⚙️  Initializing Capacitor..."
    echo "When prompted, enter:"
    echo "  - App name: Chouhan Housing CRM"
    echo "  - App ID: com.chouhanhousing.crm"
    echo "  - Web dir: dist"
    echo ""
    npx cap init
else
    echo "✅ Capacitor already initialized"
fi

# Add Android platform
if [ ! -d "android" ]; then
    echo ""
    echo "📱 Adding Android platform..."
    npx cap add android
else
    echo "✅ Android platform already added"
fi

# Sync
echo ""
echo "🔄 Syncing to Android..."
npx cap sync android

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Install Android Studio if you haven't: https://developer.android.com/studio"
echo "2. Open the project in Android Studio:"
echo "   npx cap open android"
echo "3. Wait for Gradle sync to complete"
echo "4. Click Run (▶️) to build and run on emulator/device"
echo ""
echo "📚 For detailed instructions, see: MOBILE_APP_SETUP.md"

