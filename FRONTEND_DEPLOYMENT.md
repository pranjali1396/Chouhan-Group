# Frontend Deployment Guide - Connect to Render Backend

## 🎯 Problem: Frontend Not Showing Leads

After deploying your frontend, it's still trying to connect to `localhost:5000` instead of your Render backend.

---

## ✅ Solution: Set Environment Variable

### Option 1: Automatic Detection (Already Implemented)

The frontend will **automatically** use the Render staging backend if:
- ✅ Frontend is deployed (not running on localhost)
- ✅ Backend is deployed to Render

**No action needed** - it should work automatically! 🎉

---

### Option 2: Manual Configuration (If Auto-Detection Doesn't Work)

#### For Vercel Deployment:

1. **Go to Vercel Dashboard**
   - Open your project: https://vercel.com/dashboard
   - Click on your project

2. **Go to Settings → Environment Variables**

3. **Add Environment Variable:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://chouhan-crm-backend-staging.onrender.com/api/v1`
   - **Environment:** Production, Preview, Development (select all)

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger auto-deploy

---

### Option 3: Update Code (For Production)

When ready for production, update `services/api.ts`:

```typescript
// Change the auto-detect URL to production
return 'https://chouhan-crm-backend.onrender.com/api/v1';
```

---

## 🔍 Verify It's Working

### Step 1: Check Browser Console

1. Open your deployed frontend
2. Press F12 to open DevTools
3. Go to "Console" tab
4. Look for API calls - they should go to Render URL, not localhost

### Step 2: Check Network Tab

1. Open DevTools → "Network" tab
2. Refresh the page
3. Look for requests to `/api/v1/leads`
4. Check the URL - should be `chouhan-crm-backend-staging.onrender.com`

### Step 3: Test Backend Connection

Visit these URLs directly in browser:

**Health Check:**
```
https://chouhan-crm-backend-staging.onrender.com/health
```

**Get Leads:**
```
https://chouhan-crm-backend-staging.onrender.com/api/v1/leads
```

Both should return JSON data (not errors).

---

## 🐛 Troubleshooting

### Issue: Still seeing localhost:5000

**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Vercel environment variables are set correctly
4. Redeploy frontend

### Issue: CORS Error

**Solution:**
- Backend CORS is already configured to allow all origins
- If still seeing CORS errors, check Render logs

### Issue: Leads Not Showing

**Check:**
1. ✅ Backend is running on Render
2. ✅ Backend has leads (test `/api/v1/leads` endpoint)
3. ✅ Frontend is calling correct URL (check Network tab)
4. ✅ No errors in browser console

---

## 📝 Environment Variables Summary

| Variable | Staging Value | Production Value |
|----------|--------------|------------------|
| `VITE_API_URL` | `https://chouhan-crm-backend-staging.onrender.com/api/v1` | `https://chouhan-crm-backend.onrender.com/api/v1` |

---

## 🚀 Quick Fix (Right Now)

If you want to fix it immediately:

1. **Set in Vercel:**
   - Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://chouhan-crm-backend-staging.onrender.com/api/v1`
   - Redeploy

2. **Or wait for auto-detection:**
   - The code already detects production environment
   - Should work automatically on next deploy

---

## ✅ Next Steps

1. ✅ Set environment variable in Vercel (if needed)
2. ✅ Redeploy frontend
3. ✅ Test leads are showing
4. ✅ Verify backend connection works

