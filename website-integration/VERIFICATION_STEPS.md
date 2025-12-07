# Verification Steps - After Adding Script to Vercel

Now that you've added the script to your Next.js project, let's verify everything is working!

---

## ✅ Step 1: Verify Script is Loaded

### 1.1 Check in Browser

1. **Open your website** (local or Vercel)
2. **Go to your contact page** (`/contact-us`)
3. **Open browser console** (Press F12, then click "Console" tab)
4. **Look for this message:**
   ```
   [CRM] Found X form(s)
   ```
   If you see this, the script is loaded! ✅

### 1.2 Check Network Tab

1. **Open browser DevTools** (F12)
2. **Go to "Network" tab**
3. **Refresh the page**
4. **Look for:** `crm-integration.min.js`
5. **Status should be:** `200 OK` ✅

---

## ✅ Step 2: Verify Backend is Running

### Option A: Testing Locally

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **You should see:**
   ```
   🚀 CRM Backend Server Running!
   🚀 Port: 5000
   🚀 Webhook Endpoint: http://localhost:5000/api/v1/webhooks/lead
   ```

3. **Test health endpoint:**
   - Open: `http://localhost:5000/health`
   - Should show: `{"status":"ok",...}` ✅

### Option B: Backend Already Deployed

If your backend is already deployed:
- Check the backend URL is correct in the script
- Test the health endpoint: `https://your-backend.com/health`

---

## ✅ Step 3: Update API URL in Script

**Important:** Make sure the API URL in your script matches your backend:

### For Local Testing:
```javascript
API_URL: 'http://localhost:5000/api/v1/webhooks/lead'
```

### For Production (Vercel):
```javascript
API_URL: 'https://your-backend-api.railway.app/api/v1/webhooks/lead'
```

**Where to update:**
- File: `public/crm-integration.min.js` in your Next.js project
- Line: ~19 (look for `API_URL:`)

---

## ✅ Step 4: Test Form Submission

### 4.1 Submit Test Form

1. **Go to your contact page**
2. **Fill out the form:**
   - Name: "Test Customer"
   - Phone: "9876543210"
   - Email: "test@example.com"
   - Select other fields
3. **Submit the form**

### 4.2 Check Browser Console

After submitting, check browser console (F12):

**Should see:**
```
[CRM] Contact form detected
[CRM] Sending lead...
[CRM] ✅ Lead sent! lead-1234567890-abc123
```

**If you see errors:**
- Check API_URL is correct
- Check backend is running
- Check Network tab for failed requests

### 4.3 Check Backend Console

**If backend is running locally, you should see:**
```
✅ ===== LEAD RECEIVED FROM WEBSITE =====
📋 Lead Data: {
  "source": "Chouhan Park View Website",
  "customerName": "Test Customer",
  "mobile": "9876543210",
  ...
}
⏰ Received at: 2025-12-05T...
🌐 Source: Chouhan Park View Website
==========================================
💾 Lead stored (temporary). Total leads: 1
```

**If you see this, it's working! ✅**

---

## ✅ Step 5: Verify Leads Endpoint

### Check Received Leads

1. **Open in browser:**
   ```
   http://localhost:5000/api/v1/webhooks/leads
   ```
   (Or your production backend URL + `/api/v1/webhooks/leads`)

2. **Should see:**
   ```json
   {
     "success": true,
     "count": 1,
     "leads": [
       {
         "id": "lead-1234567890-abc123",
         "customerName": "Test Customer",
         "mobile": "9876543210",
         ...
       }
     ]
   }
   ```

---

## 🚨 Troubleshooting

### Script Not Loading?

**Check:**
- [ ] File is in `public/` folder
- [ ] Script component is added correctly
- [ ] No typos in file path
- [ ] Check browser console for errors
- [ ] Check Network tab - is file loading?

**Solution:**
- Verify file path: `/crm-integration.min.js` (starts with `/`)
- Check file exists in `public/` folder
- Clear browser cache and refresh

### Form Not Detected?

**Check:**
- [ ] Browser console shows: `[CRM] Found X form(s)`
- [ ] Form has `name`, `phone`, or `email` fields
- [ ] Form field names match what script expects

**Solution:**
- Check form HTML structure
- Verify field names (name, phone, email)
- Check browser console for debug messages

### Leads Not Sending?

**Check:**
- [ ] API_URL is correct in script
- [ ] Backend is running (for local) or deployed (for production)
- [ ] Browser console shows errors
- [ ] Network tab shows failed POST request

**Solution:**
- Verify API_URL matches your backend
- Test backend health endpoint
- Check CORS settings in backend
- Check browser console for specific errors

### CORS Errors?

**If you see CORS errors:**
- Backend already has CORS enabled
- If still issues, check backend `src/index.js`
- Make sure backend allows your Vercel domain

---

## 📊 Success Checklist

- [ ] Script loads (check browser console)
- [ ] Form detected (console shows "Found X form(s)")
- [ ] Backend running/deployed
- [ ] API_URL is correct
- [ ] Form submission works
- [ ] Backend console shows received lead
- [ ] Leads endpoint shows the lead

---

## 🎯 Next Steps (After Verification)

Once everything is working:

1. ✅ **Website integration working** ← You are here
2. **Deploy backend** (if not already deployed)
3. **Update API_URL** to production backend URL
4. **Add database** to store leads permanently
5. **Connect Google Sheets** for sync
6. **Update CRM frontend** to show new leads

---

## 📞 Need Help?

If something's not working:

1. **Share browser console errors** (F12 → Console)
2. **Share backend console output**
3. **Share Network tab** (F12 → Network → look for failed requests)
4. **Tell me which step failed**

---

## 🎉 Success!

If you see the lead in your backend console, **congratulations!** 🎊

Your website is now connected to the CRM. Every form submission will send leads to your backend.

**Next:** We'll add a database to store these leads permanently!




