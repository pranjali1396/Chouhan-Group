# 📱 Convert to Mobile App with Android Studio

This guide will help you convert your React CRM app into a native Android (and iOS) mobile app using **Capacitor**.

---

## 🎯 What is Capacitor?

Capacitor wraps your existing React web app in a native container, allowing you to:
- ✅ Use Android Studio to build Android apps
- ✅ Use Xcode to build iOS apps
- ✅ Publish to Google Play Store and Apple App Store
- ✅ Access native device features (camera, GPS, notifications, etc.)
- ✅ Keep your existing React code (no rewriting needed!)

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ Node.js installed (v16 or higher)
- ✅ Android Studio installed ([Download here](https://developer.android.com/studio))
- ✅ Java JDK 11 or higher
- ✅ Your React app builds successfully (`npm run build`)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Capacitor

```bash
# Install Capacitor CLI and core
npm install @capacitor/core @capacitor/cli

# Install Android and iOS platforms
npm install @capacitor/android @capacitor/ios
```

### Step 2: Initialize Capacitor

```bash
npx cap init
```

**When prompted, enter:**
- **App name:** `Chouhan Housing CRM`
- **App ID:** `com.chouhanhousing.crm` (or your preferred bundle ID)
- **Web dir:** `dist` (this is where Vite builds your app)

This creates a `capacitor.config.ts` file.

### Step 3: Build Your Web App

```bash
npm run build
```

This creates the `dist` folder with your production-ready app.

### Step 4: Add Android Platform

```bash
npx cap add android
```

This creates an `android` folder in your project root.

### Step 5: Sync Your App

```bash
npx cap sync
```

This copies your web app files to the Android project.

### Step 6: Open in Android Studio

```bash
npx cap open android
```

This opens your project in Android Studio.

---

## 🏗️ Building in Android Studio

### First Time Setup in Android Studio

1. **Wait for Gradle Sync**
   - Android Studio will automatically sync Gradle dependencies
   - This may take 5-10 minutes on first run
   - Watch the bottom status bar for progress

2. **Install Required SDKs** (if prompted)
   - Click "Install missing SDKs" if Android Studio asks
   - Accept licenses when prompted

3. **Check Build Variants**
   - Bottom left: Click "Build Variants"
   - Select "debug" for testing, "release" for production

### Build and Run

#### Option A: Run on Emulator

1. **Create Virtual Device:**
   - Tools → Device Manager
   - Click "Create Device"
   - Choose a phone (e.g., Pixel 5)
   - Download a system image (e.g., Android 13)
   - Finish setup

2. **Run App:**
   - Click the green "Run" button (▶️) or press `Shift+F10`
   - Select your emulator
   - App will build and launch automatically

#### Option B: Run on Physical Device

1. **Enable Developer Mode on Phone:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect Phone:**
   - Connect via USB
   - Allow USB debugging when prompted on phone

3. **Run App:**
   - Click "Run" button in Android Studio
   - Select your connected device
   - App will install and launch

---

## 📦 Building Release APK/AAB

### For Testing (APK)

1. **Build → Generate Signed Bundle / APK**
2. Select **APK** → Next
3. **Create New Keystore:**
   - Click "Create new..."
   - Choose location and password
   - Fill in certificate details
   - Click OK
4. **Select Keystore** → Next
5. **Build Variant:** `release` → Finish
6. **APK Location:** `android/app/release/app-release.apk`

### For Google Play Store (AAB)

1. **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle** → Next
3. Select your keystore → Next
4. **Build Variant:** `release` → Finish
5. **AAB Location:** `android/app/release/app-release.aab`

---

## 🔄 Updating Your App

After making changes to your React code:

```bash
# 1. Rebuild your web app
npm run build

# 2. Sync changes to Android project
npx cap sync android

# 3. Open Android Studio (if not already open)
npx cap open android

# 4. Build and run in Android Studio
```

**Note:** Always run `npm run build` before `npx cap sync` to ensure latest changes are included.

---

## ⚙️ Configuration

### Update `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chouhanhousing.crm',
  appName: 'Chouhan Housing CRM',
  webDir: 'dist',
  server: {
    // Remove this in production - only for development
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
```

### Update Android App Name

1. Open `android/app/src/main/res/values/strings.xml`
2. Change:
   ```xml
   <string name="app_name">Chouhan Housing CRM</string>
   ```

### Update App Icon

1. **Create icon files:**
   - Use online tool: https://www.appicon.co/
   - Generate Android icons (all sizes)

2. **Replace icons:**
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - Replace all sizes (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

### Update Splash Screen

1. Create splash screen images
2. Replace in `android/app/src/main/res/drawable/`

---

## 🔌 Adding Native Features

### Install Capacitor Plugins

```bash
# Camera
npm install @capacitor/camera

# Geolocation
npm install @capacitor/geolocation

# Push Notifications
npm install @capacitor/push-notifications

# Network Status
npm install @capacitor/network

# Storage (for offline data)
npm install @capacitor/preferences
```

### Sync After Installing Plugins

```bash
npm run build
npx cap sync android
```

### Use in Your Code

Example - Camera:

```typescript
import { Camera } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: 'base64'
  });
  
  // Use image.data
};
```

---

## 🌐 API Configuration

### Update API URL for Mobile

In `services/api.ts`, ensure it works for mobile:

```typescript
const getApiUrl = (): string => {
  // For mobile app, use production API
  if (window.location.protocol === 'capacitor:') {
    return 'https://chouhan-crm-backend.onrender.com/api/v1';
  }
  
  // Existing logic for web...
};
```

---

## 📱 iOS Setup (Optional - Mac Only)

If you have a Mac and want to build for iOS:

```bash
# Install iOS platform
npx cap add ios

# Sync
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## 🐛 Troubleshooting

### Issue: "Gradle sync failed"

**Solution:**
1. File → Invalidate Caches / Restart
2. Check internet connection (Gradle downloads dependencies)
3. Check Android Studio version (use latest stable)

### Issue: "SDK not found"

**Solution:**
1. Tools → SDK Manager
2. Install Android SDK Platform (latest)
3. Install Android SDK Build-Tools

### Issue: "App crashes on launch"

**Solution:**
1. Check Logcat in Android Studio (bottom panel)
2. Look for error messages
3. Common issues:
   - API URL not accessible
   - Missing permissions
   - CORS issues (check backend)

### Issue: "Changes not appearing"

**Solution:**
1. Always run `npm run build` first
2. Then run `npx cap sync android`
3. Rebuild in Android Studio

### Issue: "Keystore not found" (Release Build)

**Solution:**
- Create keystore first (see "Building Release APK" section)
- Save keystore password securely (you'll need it for updates)

---

## 📋 Checklist

### Initial Setup
- [ ] Install Capacitor
- [ ] Initialize Capacitor
- [ ] Build web app (`npm run build`)
- [ ] Add Android platform
- [ ] Sync to Android
- [ ] Open in Android Studio
- [ ] Gradle sync successful
- [ ] App runs on emulator/device

### Before Publishing
- [ ] Update app name and icon
- [ ] Configure API URLs for production
- [ ] Test all features on device
- [ ] Create release keystore
- [ ] Build release APK/AAB
- [ ] Test release build
- [ ] Prepare app store listing

---

## 🚀 Publishing to Google Play Store

1. **Create Google Play Developer Account**
   - Cost: $25 one-time fee
   - Visit: https://play.google.com/console

2. **Prepare App Listing**
   - App name, description, screenshots
   - Privacy policy URL
   - App icon (512x512)

3. **Upload AAB**
   - Go to Play Console
   - Create new app
   - Upload your `.aab` file
   - Fill in store listing
   - Submit for review

4. **Release**
   - Start with internal testing
   - Then closed beta
   - Finally production

---

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio)
- [Google Play Console](https://play.google.com/console)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

---

## 🎯 Quick Commands Reference

```bash
# Initial setup
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npm run build
npx cap add android
npx cap sync android
npx cap open android

# After making changes
npm run build
npx cap sync android

# iOS (Mac only)
npx cap add ios
npx cap sync ios
npx cap open ios
```

---

## ✅ Next Steps

1. ✅ Complete setup steps above
2. ✅ Test app on emulator/device
3. ✅ Add any native features you need
4. ✅ Build release version
5. ✅ Publish to Google Play Store

**Your React web app is now a native mobile app! 🎉**

