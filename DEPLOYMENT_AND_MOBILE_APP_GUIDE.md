# 🚀 Complete Deployment & Mobile App Guide

This guide covers deploying your CRM application and converting it to a mobile app.

---

## 📱 Part 1: Web Deployment

### Option A: Deploy to Vercel (Recommended - Easiest)

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build your app:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - It will ask for project settings (just press Enter for defaults)
   - Your app will be live at `https://your-app.vercel.app`

4. **Set Environment Variables (if needed):**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `VITE_API_URL` pointing to your backend API

5. **Automatic Deployments:**
   - Connect your GitHub repo to Vercel
   - Every push to `main` branch will auto-deploy

**Vercel Dashboard:** https://vercel.com/dashboard

---

### Option B: Deploy to Netlify

**Steps:**

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build your app:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Or use Netlify Dashboard:**
   - Go to https://app.netlify.com
   - Drag and drop your `dist` folder (after `npm run build`)

---

### Option C: Deploy to GitHub Pages

**Steps:**

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/chouhan-group-main"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

---

### Option D: Deploy to Render

**Steps:**

1. **Create a `render.yaml` file in root:**
   ```yaml
   services:
     - type: web
       name: chouhan-crm-frontend
       env: static
       buildCommand: npm install && npm run build
       staticPublishPath: ./dist
       envVars:
         - key: VITE_API_URL
           value: https://your-backend.onrender.com
   ```

2. **Connect GitHub repo to Render**
3. **Auto-deploys on push**

---

## 📱 Part 2: Convert to Mobile App

### Option 1: Progressive Web App (PWA) - Recommended ⭐

**Best for:** Quick mobile app experience without app stores

**Steps:**

1. **Install PWA plugin:**
   ```bash
   npm install -D vite-plugin-pwa
   ```

2. **Update `vite.config.ts`:**
   ```typescript
   import { VitePWA } from 'vite-plugin-pwa'

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
         manifest: {
           name: 'Chouhan Housing CRM',
           short_name: 'Chouhan CRM',
           description: 'CRM System for Chouhan Housing',
           theme_color: '#3b82f6',
           icons: [
             {
               src: 'pwa-192x192.png',
               sizes: '192x192',
               type: 'image/png'
             },
             {
               src: 'pwa-512x512.png',
               sizes: '512x512',
               type: 'image/png'
             }
           ]
         }
       })
     ]
   })
   ```

3. **Create `public/manifest.json`:**
   ```json
   {
     "name": "Chouhan Housing CRM",
     "short_name": "Chouhan CRM",
     "description": "CRM System for Chouhan Housing Private Limited",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#3b82f6",
     "orientation": "portrait",
     "icons": [
       {
         "src": "/pwa-192x192.png",
         "sizes": "192x192",
         "type": "image/png",
         "purpose": "any maskable"
       },
       {
         "src": "/pwa-512x512.png",
         "sizes": "512x512",
         "type": "image/png",
         "purpose": "any maskable"
       }
     ]
   }
   ```

4. **Update `index.html`:**
   ```html
   <head>
     <link rel="manifest" href="/manifest.json">
     <meta name="theme-color" content="#3b82f6">
     <meta name="apple-mobile-web-app-capable" content="yes">
     <meta name="apple-mobile-web-app-status-bar-style" content="default">
     <meta name="apple-mobile-web-app-title" content="Chouhan CRM">
     <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   </head>
   ```

5. **Create app icons:**
   - Create `public/pwa-192x192.png` (192x192 pixels)
   - Create `public/pwa-512x512.png` (512x512 pixels)
   - Create `public/apple-touch-icon.png` (180x180 pixels)

6. **Build and test:**
   ```bash
   npm run build
   npm run preview
   ```

**How users install:**
- **Android:** "Add to Home Screen" prompt appears
- **iOS Safari:** Share button → "Add to Home Screen"

---

### Option 2: Capacitor (Native Mobile Apps) - Full Native Experience

**Best for:** Publishing to App Store and Google Play

**Steps:**

1. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/ios @capacitor/android
   ```

2. **Initialize Capacitor:**
   ```bash
   npx cap init
   ```
   - App name: `Chouhan Housing CRM`
   - App ID: `com.chouhanhousing.crm`
   - Web dir: `dist`

3. **Build your app:**
   ```bash
   npm run build
   ```

4. **Add platforms:**
   ```bash
   npx cap add ios
   npx cap add android
   ```

5. **Sync:**
   ```bash
   npx cap sync
   ```

6. **Open in native IDEs:**
   ```bash
   # For Android
   npx cap open android
   
   # For iOS (Mac only)
   npx cap open ios
   ```

7. **Configure Android:**
   - Open Android Studio
   - Build → Generate Signed Bundle/APK
   - Follow prompts to create release build

8. **Configure iOS:**
   - Open Xcode
   - Set up signing certificates
   - Archive and upload to App Store

**Capacitor Plugins you might need:**
```bash
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/network
```

---

### Option 3: React Native (Not Recommended)

**Why not:** Would require rewriting the entire app. Your current React app won't work directly.

**If you want native performance:** Use Capacitor instead (Option 2).

---

## 🔧 Part 3: Backend Deployment

Your backend also needs to be deployed. See `backend/RENDER_DEPLOYMENT.md` for details.

**Quick steps:**

1. **Deploy to Render:**
   - Connect GitHub repo
   - Select `backend` folder
   - Set environment variables
   - Deploy

2. **Update frontend API URL:**
   - Set `VITE_API_URL` in frontend environment variables
   - Or update `services/api.ts` with production URL

---

## 📋 Complete Deployment Checklist

### Frontend Deployment:
- [ ] Build the app (`npm run build`)
- [ ] Test the build locally (`npm run preview`)
- [ ] Deploy to Vercel/Netlify/Render
- [ ] Set environment variables
- [ ] Test production URL
- [ ] Configure custom domain (optional)

### PWA Setup:
- [ ] Install `vite-plugin-pwa`
- [ ] Configure `vite.config.ts`
- [ ] Create `manifest.json`
- [ ] Create app icons (192x192, 512x512, apple-touch-icon)
- [ ] Update `index.html` with PWA meta tags
- [ ] Test PWA installation on mobile devices

### Mobile App (Capacitor):
- [ ] Install Capacitor
- [ ] Initialize Capacitor
- [ ] Build frontend
- [ ] Add iOS/Android platforms
- [ ] Configure app icons and splash screens
- [ ] Test on devices
- [ ] Build release versions
- [ ] Submit to App Store / Google Play

### Backend Deployment:
- [ ] Deploy backend API
- [ ] Set Supabase environment variables
- [ ] Test API endpoints
- [ ] Update frontend API URL
- [ ] Enable CORS for production domain

---

## 🎯 Recommended Approach

**For Quick Launch:**
1. Deploy frontend to Vercel (5 minutes)
2. Deploy backend to Render (10 minutes)
3. Add PWA support (30 minutes)
4. Test on mobile devices

**For Full Mobile App:**
1. Complete "Quick Launch" steps
2. Add Capacitor
3. Build native apps
4. Submit to app stores

---

## 📱 Testing Mobile App

### PWA Testing:
1. Deploy to production
2. Open on mobile device
3. Look for "Add to Home Screen" prompt
4. Test offline functionality
5. Test push notifications (if added)

### Native App Testing:
1. Build debug APK/IPA
2. Install on test devices
3. Test all features
4. Fix any native-specific issues
5. Build release version

---

## 🆘 Troubleshooting

### PWA not installing:
- Check HTTPS (required for PWA)
- Verify manifest.json is accessible
- Check browser console for errors
- Ensure service worker is registered

### Capacitor build fails:
- Make sure `npm run build` succeeds first
- Check `npx cap sync` output
- Verify platform folders exist
- Check native IDE for specific errors

### API not working in production:
- Verify CORS settings
- Check environment variables
- Test API endpoints directly
- Check browser console for errors

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

## 🚀 Quick Start Commands

```bash
# 1. Build for production
npm run build

# 2. Deploy to Vercel
vercel

# 3. Add PWA support
npm install -D vite-plugin-pwa
# Then update vite.config.ts and add manifest.json

# 4. Add Capacitor (for native apps)
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init
npx cap add ios
npx cap add android
npx cap sync
```

---

**Need help?** Check the specific deployment guides in the project or create an issue.

