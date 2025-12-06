# Deploy Backend to Render

## Step-by-Step Deployment Guide

### Prerequisites
- Your code is pushed to GitHub (✅ Already done!)
- GitHub repository: https://github.com/pranjali1396/Chouhan-Group.git

### Step 1: Sign Up / Login to Render
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up using your GitHub account (recommended)

### Step 2: Create a New Web Service
1. Click "New +" button in the dashboard
2. Select "Web Service"
3. Click "Connect" next to your GitHub repository: `Chouhan-Group`
4. If you don't see it, click "Configure account" and grant access to the repository

### Step 3: Configure the Service
Fill in the following details:

**Name:** `chouhan-crm-backend` (or any name you prefer)

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

### Step 4: Add Environment Variables
Click "Advanced" and add these environment variables:

1. **SUPABASE_URL**
   - Value: Your Supabase project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key
   - ⚠️ Keep this secret!

3. **NODE_ENV**
   - Value: `production`

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Pull your code from GitHub
   - Install dependencies
   - Start your server
3. Wait 2-3 minutes for deployment to complete

### Step 6: Get Your Backend URL
Once deployed, you'll see your backend URL:
```
https://chouhan-crm-backend.onrender.com
```

### Step 7: Test Your Backend
Test these endpoints:

**Health Check:**
```
https://chouhan-crm-backend.onrender.com/health
```

**Get Leads:**
```
https://chouhan-crm-backend.onrender.com/api/v1/leads
```

**Webhook Endpoint (for website forms):**
```
https://chouhan-crm-backend.onrender.com/api/v1/webhooks/lead
```

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
After deployment, update your frontend's API URL from:
```javascript
http://localhost:5000
```
to:
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

## Next Steps
After deployment:
1. ✅ Test all endpoints
2. ✅ Update frontend API URL
3. ✅ Update webhook URL in website forms
4. ✅ Test lead submission from website

---

## Support
If you encounter issues:
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com

