# ⚡ Quick Deployment Guide

**Fast track to get your CRM live in 15 minutes!**

---

## 🎯 Quick Steps

### 1️⃣ Deploy Backend (5 min)

1. Go to https://render.com → Sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect repo: `Chouhan-Group`
4. Settings:
   - Name: `chouhan-crm-backend`
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = (your Supabase URL)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your Supabase key)
6. Click **"Create Web Service"**
7. Wait for deployment → Copy URL: `https://chouhan-crm-backend.onrender.com`

### 2️⃣ Deploy Frontend (5 min)

1. Go to https://vercel.com → Sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import repo: `Chouhan-Group`
4. Settings:
   - Framework: `Vite` (auto-detected)
   - Build: `npm run build`
   - Output: `dist`
5. Add Environment Variable (optional - auto-detects):
   - `VITE_API_URL` = `https://chouhan-crm-backend.onrender.com/api/v1`
6. Click **"Deploy"**
7. Wait for deployment → Copy URL: `https://your-app.vercel.app`

### 3️⃣ Test (2 min)

1. Visit your Vercel URL
2. Login
3. Check leads are loading ✅

### 4️⃣ Update Website Script (3 min)

If you have a website:

1. Edit `website-integration/crm-integration.min.js`
2. Change line 19:
   ```javascript
   API_URL: 'https://chouhan-crm-backend.onrender.com/api/v1/webhooks/lead',
   ```
3. Commit and push
4. Update your website to use new script

---

## ✅ Done!

Your CRM is now live and ready to use! 🎉

**Full guide:** See `PRODUCTION_DEPLOYMENT.md` for detailed instructions.

