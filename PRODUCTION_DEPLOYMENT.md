# 🚀 Complete Production Deployment Guide

This guide will help you deploy your **Chouhan Group CRM** application to production, making it ready for real-world use.

---

## 📋 Overview

Your application consists of:
1. **Frontend** (React/Vite) → Deploy to **Vercel**
2. **Backend** (Node.js/Express) → Deploy to **Render**
3. **Database** (Supabase) → Already configured

---

## ✅ Prerequisites

Before starting, make sure you have:
- ✅ Code pushed to GitHub: `https://github.com/pranjali1396/Chouhan-Group.git`
- ✅ Supabase account with project created
- ✅ Supabase URL and Service Role Key ready
- ✅ GitHub account connected to Vercel and Render

---

## 🎯 Step 1: Deploy Backend to Render (Production)

### 1.1 Create Production Web Service

1. **Go to Render Dashboard**
   - Visit: https://render.com
   - Sign in with GitHub

2. **Create New Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect repository: `Chouhan-Group`
   - If not visible, click **"Configure account"** and authorize

### 1.2 Configure Production Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `chouhan-crm-backend` |
| **Region** | Choose closest to you (e.g., Singapore, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **IMPORTANT** |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or upgrade to paid for always-on) |

### 1.3 Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | Render will override this |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | ⚠️ Keep secret! |

### 1.4 Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Copy your backend URL: `https://chouhan-crm-backend.onrender.com`

### 1.5 Test Backend

Visit these URLs to verify:

**Health Check:**
```
https://chouhan-crm-backend.onrender.com/health
```

**API Info:**
```
https://chouhan-crm-backend.onrender.com/
```

**Get Leads:**
```
https://chouhan-crm-backend.onrender.com/api/v1/leads
```

All should return JSON (not errors).

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Import repository: `Chouhan-Group`
   - Click **"Import"**

### 2.2 Configure Frontend

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `./` (root) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.3 Set Environment Variables

Go to **"Environment Variables"** and add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://chouhan-crm-backend.onrender.com/api/v1` | Production, Preview, Development |

**Or** the frontend will auto-detect production and use the Render backend automatically.

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build and deployment
3. Copy your frontend URL: `https://chouhan-group.vercel.app` (or similar)

### 2.5 Test Frontend

1. Visit your Vercel URL
2. Login with any user
3. Check if leads are loading from backend
4. Open browser DevTools → Network tab
5. Verify API calls go to Render backend (not localhost)

---

## 🔗 Step 3: Connect Frontend to Backend

### Option A: Automatic (Already Implemented)

The frontend automatically detects production and uses Render backend. **No action needed!**

### Option B: Manual (If Needed)

If auto-detection doesn't work:

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Environment Variables**
   - Add: `VITE_API_URL` = `https://chouhan-crm-backend.onrender.com/api/v1`
   - Select all environments
   - Click **"Save"**

2. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on latest deployment

---

## 🌐 Step 4: Update Website Integration Script

If you have a website that submits leads to the CRM:

### 4.1 Update CRM Integration Script

Edit `website-integration/crm-integration.min.js`:

**Find this line (~19):**
```javascript
API_URL: 'http://localhost:5000/api/v1/webhooks/lead',
```

**Replace with:**
```javascript
API_URL: 'https://chouhan-crm-backend.onrender.com/api/v1/webhooks/lead',
```

### 4.2 Deploy Updated Script

1. Commit the change:
   ```bash
   git add website-integration/crm-integration.min.js
   git commit -m "Update API URL to production backend"
   git push origin main
   ```

2. Update your website to use the new script URL

---

## ✅ Step 5: Verification Checklist

### Backend Verification

- [ ] Backend is running on Render
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] API endpoints are accessible
- [ ] CORS is working (no CORS errors)
- [ ] Supabase connection is working

### Frontend Verification

- [ ] Frontend is deployed on Vercel
- [ ] Can login successfully
- [ ] Leads page loads data from backend
- [ ] No console errors
- [ ] API calls go to Render backend (check Network tab)

### Integration Verification

- [ ] Can submit leads from website
- [ ] Leads appear in CRM
- [ ] All features work (add lead, update lead, etc.)

---

## 🔧 Step 6: Production Optimizations

### 6.1 Backend (Render)

**Free Tier Limitations:**
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Takes 30-60 seconds to wake up on first request
- ✅ 750 hours/month free

**Upgrade Options:**
- **Starter Plan ($7/month)**: Always-on, faster response
- **Professional Plan ($25/month)**: More resources

### 6.2 Frontend (Vercel)

**Free Tier Includes:**
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Custom domains

**Optional:**
- Add custom domain in Vercel settings
- Enable analytics

---

## 🐛 Troubleshooting

### Issue: Frontend shows "No leads"

**Solution:**
1. Check backend is running: Visit `https://chouhan-crm-backend.onrender.com/health`
2. Check browser console for errors
3. Verify `VITE_API_URL` environment variable is set
4. Check Network tab - API calls should go to Render

### Issue: CORS Errors

**Solution:**
- Backend CORS is already configured
- If still seeing errors, check Render logs
- Verify backend URL is correct

### Issue: Backend is Slow

**Solution:**
- Free tier spins down after inactivity
- First request after inactivity takes time
- Consider upgrading to paid tier for always-on

### Issue: Environment Variables Not Working

**Solution:**
1. Verify variables are set correctly in Vercel/Render
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

---

## 📊 Monitoring & Maintenance

### Backend Logs (Render)

1. Go to Render Dashboard
2. Click on your backend service
3. Click **"Logs"** tab
4. View real-time logs

### Frontend Logs (Vercel)

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **"Deployments"** → Click deployment → **"View Function Logs"**

### Health Monitoring

Set up uptime monitoring:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom**: https://pingdom.com

Monitor these endpoints:
- `https://chouhan-crm-backend.onrender.com/health`
- `https://your-frontend.vercel.app`

---

## 🔐 Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] Supabase Service Role Key is kept secret
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic on Vercel/Render)
- [ ] No sensitive data in frontend code

---

## 🎉 Success!

Your CRM application is now live and ready to use!

**Your URLs:**
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://chouhan-crm-backend.onrender.com`
- **API Docs:** `https://chouhan-crm-backend.onrender.com/`

---

## 📞 Next Steps

1. ✅ Share frontend URL with your team
2. ✅ Test all features in production
3. ✅ Set up monitoring
4. ✅ Update website integration scripts
5. ✅ Train users on the new system

---

## 🆘 Need Help?

If you encounter issues:
1. Check logs in Render/Vercel dashboards
2. Review this guide again
3. Check browser console for errors
4. Verify all environment variables are set

---

**Congratulations! Your CRM is now in production! 🚀**

