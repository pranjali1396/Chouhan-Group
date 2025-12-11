# API URL Explanation

## 🔍 What is the API URL?

The **API URL** is the address of your **BACKEND SERVER** (where the webhook endpoint is), **NOT** your website URL.

---

## 📍 Two Different URLs

### 1. Website URL (Your Vercel Site)
```
https://chouhan-park-view-xi.vercel.app
```
This is where your website is hosted. **This is NOT the API URL.**

### 2. API URL (Your Backend Server)
```
http://localhost:5000/api/v1/webhooks/lead  (for local testing)
https://your-backend-api.com/api/v1/webhooks/lead  (for production)
```
This is where your backend API is running. **This IS the API URL you need.**

---

## 🎯 Current Setup

### For Local Testing (Right Now):
```javascript
API_URL: 'http://localhost:5000/api/v1/webhooks/lead'
```
- ✅ Use this when testing locally
- ✅ Backend runs on your computer (port 5000)
- ✅ Website can call this if both are on same computer

### For Production (After Deploying Backend):
```javascript
API_URL: 'https://crm-backend.railway.app/api/v1/webhooks/lead'
```
- ✅ Use this when backend is deployed
- ✅ Replace with your actual backend URL
- ✅ Website (Vercel) will call this deployed backend

---

## 🚀 How It Works

```
┌─────────────────────────┐
│   Your Website          │
│   (Vercel)              │
│   chouhan-park-view...   │
└──────────┬──────────────┘
           │
           │ Sends lead data
           │ via fetch()
           │
           ▼
┌─────────────────────────┐
│   Backend API           │
│   (Railway/Render/etc)  │
│   crm-backend...        │
│   /api/v1/webhooks/lead │
└─────────────────────────┘
```

**The website calls the backend API, not the other way around.**

---

## 📝 Step-by-Step: What URL to Use When

### Step 1: Testing Locally (Now)
1. **Backend runs on:** `http://localhost:5000`
2. **API URL in script:** `http://localhost:5000/api/v1/webhooks/lead`
3. **Website:** Can test locally or use ngrok to expose localhost

### Step 2: Deploy Backend (Next)
1. Deploy backend to Railway/Render/etc.
2. Get your backend URL: `https://crm-backend-abc123.railway.app`
3. **API URL in script:** `https://crm-backend-abc123.railway.app/api/v1/webhooks/lead`

### Step 3: Update Website Script
1. Update `crm-integration.min.js` line 19:
   ```javascript
   API_URL: 'https://crm-backend-abc123.railway.app/api/v1/webhooks/lead'
   ```
2. Deploy updated website to Vercel

---

## 🔧 How to Find Your Backend URL

### If Using Railway:
1. Deploy backend to Railway
2. Railway gives you a URL like: `https://crm-backend-production.up.railway.app`
3. Your API URL: `https://crm-backend-production.up.railway.app/api/v1/webhooks/lead`

### If Using Render:
1. Deploy backend to Render
2. Render gives you a URL like: `https://crm-backend.onrender.com`
3. Your API URL: `https://crm-backend.onrender.com/api/v1/webhooks/lead`

### If Using Other Services:
- Backend URL + `/api/v1/webhooks/lead`
- Example: `https://your-backend.com/api/v1/webhooks/lead`

---

## ✅ Quick Reference

| What | URL Type | Example |
|------|----------|---------|
| **Website URL** | Your Vercel site | `https://chouhan-park-view-xi.vercel.app` |
| **API URL (Local)** | Backend on your computer | `http://localhost:5000/api/v1/webhooks/lead` |
| **API URL (Production)** | Deployed backend | `https://crm-backend.railway.app/api/v1/webhooks/lead` |

---

## 🎯 For Now (Testing)

**Use this in the script:**
```javascript
API_URL: 'http://localhost:5000/api/v1/webhooks/lead'
```

**Make sure:**
1. Backend is running: `cd backend && npm run dev`
2. Backend shows: `🚀 Port: 5000`
3. Test with `test-integration.html`

---

## 🚀 For Production (Later)

**After deploying backend, use:**
```javascript
API_URL: 'https://YOUR-BACKEND-URL/api/v1/webhooks/lead'
```

**Replace `YOUR-BACKEND-URL` with your actual deployed backend URL.**

---

## ❓ Common Questions

**Q: Is the API URL the same as my website URL?**  
A: No! Website URL is where your site is (Vercel). API URL is where your backend is (Railway/etc).

**Q: Can I use localhost for production?**  
A: No, localhost only works on your computer. You need to deploy the backend.

**Q: Where do I get the backend URL?**  
A: After deploying backend to Railway/Render/etc., they give you a URL. Use that + `/api/v1/webhooks/lead`

**Q: What if I haven't deployed backend yet?**  
A: Use `http://localhost:5000/api/v1/webhooks/lead` for testing. Deploy backend later for production.

---

## 📞 Need Help?

If you're not sure which URL to use:
1. **For testing now:** Use `http://localhost:5000/api/v1/webhooks/lead`
2. **For production:** Deploy backend first, then use that URL
3. **Check backend console:** It shows the URL when it starts








