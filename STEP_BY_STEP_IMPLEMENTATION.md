# Step-by-Step Implementation Guide
## Connecting Your Website to CRM

Follow these steps in order to connect your website to the CRM.

---

## ✅ Step 1: Backend Setup (DONE)

**Status:** ✅ Completed

The backend server is set up and ready. It's running on `http://localhost:5000`

**What was done:**
- ✅ Backend folder created
- ✅ Dependencies installed
- ✅ Server configured
- ✅ Webhook endpoint ready at `/api/v1/webhooks/lead`

---

## 🔧 Step 2: Test Backend Locally

**Let's verify the backend is working:**

### 2.1 Start the Backend Server

Open a terminal and run:
```bash
cd backend
npm run dev
```

You should see:
```
🚀 CRM Backend Server Running!
🚀 Port: 5000
🚀 Webhook Endpoint: http://localhost:5000/api/v1/webhooks/lead
```

### 2.2 Test the Health Endpoint

Open in browser: `http://localhost:5000/health`

You should see:
```json
{
  "status": "ok",
  "message": "CRM Backend is running!",
  "timestamp": "..."
}
```

### 2.3 Test Webhook with Test Form

1. Open `test-website-form.html` in your browser
2. Fill in the form (pre-filled with test data)
3. Click "Submit Inquiry"
4. **Check backend console** - you should see:
   ```
   ✅ ===== LEAD RECEIVED FROM WEBSITE =====
   📋 Lead Data: { ... }
   ```

**If you see the data in the console, Step 2 is complete! ✅**

---

## 📝 Step 3: Prepare Integration Script for Your Website

### 3.1 Update API URL

Open `website-integration/crm-integration.min.js`

Find line 18 and update:
```javascript
// For local testing (current):
API_URL: 'http://localhost:5000/api/v1/webhooks/lead',

// For production (after deploying backend):
// API_URL: 'https://your-backend-api.com/api/v1/webhooks/lead',
```

**For now, keep it as localhost for testing.**

### 3.2 Verify Form Field Names

The script looks for these field names in your form:
- `name` or `Name` - Customer name
- `phone` or `Phone` - Phone number  
- `email` or `Email` - Email address
- `broker` - Are you a broker? (Yes/No)
- `source` - How did you hear about us?
- `homeType` - Home type interested in?

**Check your website form** - do these field names match? If not, we'll customize the script.

---

## 🌐 Step 4: Add Script to Your Vercel Website

### Option A: If You Have Access to Website Code

1. **Copy the script:**
   - Copy `website-integration/crm-integration.min.js`
   - Paste it into your Vercel project's `public` folder

2. **Add to your contact page:**
   - Open your contact page file (e.g., `contact-us.html` or component)
   - Add before `</body>` tag:
   ```html
   <script src="/crm-integration.min.js"></script>
   ```

3. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add CRM integration"
   git push
   ```

### Option B: If Using Next.js

1. **Copy script to `public` folder:**
   ```bash
   cp website-integration/crm-integration.min.js your-vercel-project/public/
   ```

2. **Add to `pages/_app.js` or `app/layout.js`:**
   ```javascript
   import Script from 'next/script';

   export default function MyApp({ Component, pageProps }) {
     return (
       <>
         <Component {...pageProps} />
         <Script 
           src="/crm-integration.min.js" 
           strategy="afterInteractive" 
         />
       </>
     );
   }
   ```

### Option C: Inline Script (If Can't Add External File)

1. Copy the entire content of `crm-integration.min.js`
2. Add directly in your HTML:
   ```html
   <script>
     // Paste entire script content here
   </script>
   ```

---

## 🧪 Step 5: Test Integration

### 5.1 Test Locally First

1. **Keep backend running** on `http://localhost:5000`
2. **Update script** to use `http://localhost:5000/api/v1/webhooks/lead`
3. **Open your website locally** (or use ngrok to expose localhost)
4. **Submit the contact form**
5. **Check backend console** - should see received lead

### 5.2 Test on Production

1. **Deploy backend** to Railway/Render/etc.
2. **Get production URL** (e.g., `https://crm-api.railway.app`)
3. **Update script** with production URL
4. **Deploy website** to Vercel
5. **Submit test form** on live website
6. **Check backend logs** to confirm

---

## 📊 Step 6: Verify Leads Are Coming Through

### Check Backend Console

When a form is submitted, you should see:
```
✅ ===== LEAD RECEIVED FROM WEBSITE =====
📋 Lead Data: {
  "source": "Chouhan Park View Website",
  "customerName": "John Doe",
  "mobile": "9876543210",
  ...
}
```

### Check Received Leads Endpoint

Visit: `http://localhost:5000/api/v1/webhooks/leads`

You should see all received leads in JSON format.

---

## 🎯 Step 7: Next Steps (After Integration Works)

Once you confirm leads are coming through:

1. ✅ **Website integration working** ← You are here
2. **Add database** to store leads permanently
3. **Connect Google Sheets** for sync
4. **Update CRM frontend** to show new leads

---

## 🆘 Troubleshooting

### Backend not starting?
- Check if port 5000 is available
- Run `npm install` in backend folder
- Check for error messages in console

### Form not sending data?
- Open browser console (F12)
- Look for errors
- Check if script is loaded (Network tab)
- Verify API_URL is correct

### CORS errors?
- Backend already has CORS enabled
- If still issues, check backend `src/index.js` CORS settings

### Data not appearing?
- Check backend console logs
- Verify form field names match
- Test webhook directly with Postman/curl first

---

## 📞 Need Help?

If you get stuck at any step:
1. Share the error message
2. Share backend console output
3. Share browser console output (F12)
4. Tell me which step you're on

---

## ✅ Checklist

- [ ] Step 1: Backend setup (DONE)
- [ ] Step 2: Test backend locally
- [ ] Step 3: Prepare integration script
- [ ] Step 4: Add script to website
- [ ] Step 5: Test integration
- [ ] Step 6: Verify leads coming through
- [ ] Step 7: Ready for database integration

---

**Let's start with Step 2 - test the backend!**



