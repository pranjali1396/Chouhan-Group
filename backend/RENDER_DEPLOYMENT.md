# Deploy Backend to Render

## 🎯 Deployment Strategy: Staging + Production

This guide sets up **TWO separate environments**:
- **Staging**: For testing before frontend deployment
- **Production**: For live deployment with frontend

---

## 📋 Prerequisites
- Your code is pushed to GitHub (✅ Already done!)
- GitHub repository: https://github.com/pranjali1396/Chouhan-Group.git
- Supabase credentials ready

---

## 🚀 Part 1: Deploy STAGING Environment (For Testing)

### Step 1: Sign Up / Login to Render
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up using your GitHub account (recommended)

### Step 2: Create Staging Web Service
1. Click "New +" button in the dashboard
2. Select "Web Service"
3. Click "Connect" next to your GitHub repository: `Chouhan-Group`
4. If you don't see it, click "Configure account" and grant access to the repository

### Step 3: Configure Staging Service
Fill in the following details:

**Name:** `chouhan-crm-backend-staging`

**Region:** Choose the closest to you (e.g., Singapore, Frankfurt, Oregon)

**Branch:** `main`

**Root Directory:** `backend`
⚠️ **IMPORTANT**: Set this to `backend` since your backend is in a subdirectory

**Runtime:** `Node`

**Build Command:** 
```
npm install
```

**Start Command:**
```
npm start
```

**Instance Type:** `Free`

### Step 4: Add Staging Environment Variables
Click "Advanced" and add these environment variables:

1. **SUPABASE_URL**
   - Value: Your Supabase project URL (can use same as production for testing)
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key
   - ⚠️ Keep this secret!

3. **NODE_ENV**
   - Value: `staging`

### Step 5: Deploy Staging
1. Click "Create Web Service"
2. Render will automatically:
   - Pull your code from GitHub
   - Install dependencies
   - Start your server
3. Wait 2-3 minutes for deployment to complete

### Step 6: Get Your Staging Backend URL
Once deployed, you'll see your staging backend URL:
```
https://chouhan-crm-backend-staging.onrender.com
```

### Step 7: Test Staging Backend
Test these endpoints:

**Health Check:**
```
https://chouhan-crm-backend-staging.onrender.com/health
```

**Get Leads:**
```
https://chouhan-crm-backend-staging.onrender.com/api/v1/leads
```

**Webhook Endpoint:**
```
https://chouhan-crm-backend-staging.onrender.com/api/v1/webhooks/lead
```

---

## 🎯 Part 2: Deploy PRODUCTION Environment (For Live Deployment)

**⚠️ Wait until your frontend is ready before deploying production!**

### Step 1: Create Production Web Service
1. Click "New +" button again in the dashboard
2. Select "Web Service"
3. Select the same GitHub repository: `Chouhan-Group`

### Step 2: Configure Production Service
Fill in the following details:

**Name:** `chouhan-crm-backend`

**Region:** Same as staging (or choose production region)

**Branch:** `main`

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:** 
```
npm install
```

**Start Command:**
```
npm start
```

**Instance Type:** `Free` (or upgrade to paid for always-on)

### Step 3: Add Production Environment Variables
Click "Advanced" and add these environment variables:

1. **SUPABASE_URL**
   - Value: Your Supabase project URL (production)
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (production)
   - ⚠️ Keep this secret!

3. **NODE_ENV**
   - Value: `production`

### Step 4: Deploy Production
1. Click "Create Web Service"
2. Wait for deployment to complete

### Step 5: Get Your Production Backend URL
Once deployed, you'll see your production backend URL:
```
https://chouhan-crm-backend.onrender.com
```

---

## 🔄 Environment URLs Summary

| Environment | URL | Purpose |
|------------|-----|---------|
| **Staging** | `https://chouhan-crm-backend-staging.onrender.com` | Testing before frontend deployment |
| **Production** | `https://chouhan-crm-backend.onrender.com` | Live deployment with frontend |

---

## 📝 Workflow

### Current Phase: Testing (Staging)
1. ✅ Deploy staging backend
2. ✅ Test all endpoints with staging URL
3. ✅ Test webhook integration
4. ✅ Verify everything works

### Next Phase: Production
1. ⏳ Deploy frontend to Vercel
2. ⏳ Deploy production backend
3. ⏳ Connect frontend to production backend
4. ⏳ Update website webhooks to production URL

---

## Important Notes

### Free Tier Limitations
- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Takes ~30-60 seconds to spin up on first request after inactivity
- ✅ 750 hours/month free (more than enough)

### Automatic Deployments
Render will automatically redeploy whenever you push to the `main` branch on GitHub!

### Update Frontend API URL

**For Staging (Testing):**
```javascript
https://chouhan-crm-backend-staging.onrender.com
```

**For Production (Live):**
```javascript
https://chouhan-crm-backend.onrender.com
```

---

## Troubleshooting

### If Deployment Fails:
1. Check the logs in Render dashboard
2. Verify `package.json` has correct start script
3. Ensure environment variables are set correctly

### If Backend is Slow:
- First request after inactivity takes time (free tier limitation)
- Consider upgrading to paid tier ($7/month) for always-on service

### View Logs:
- Click on your service in Render dashboard
- Go to "Logs" tab to see real-time logs

---

## ✅ Next Steps

### For Staging (Now):
1. ✅ Deploy staging backend
2. ✅ Test all endpoints with staging URL
3. ✅ Test webhook integration
4. ✅ Verify database connections
5. ✅ Test lead submission from website forms

### For Production (After Frontend Deployment):
1. ⏳ Deploy frontend to Vercel
2. ⏳ Deploy production backend
3. ⏳ Update frontend to use production backend URL
4. ⏳ Update website webhooks to production URL
5. ⏳ Test complete production flow

---

## Support
If you encounter issues:
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com

