# Connect Frontend to Backend - See Leads from Website

Now that leads are coming from your website, let's connect the frontend to see them in the CRM!

---

## ✅ What I Just Did

1. ✅ Added GET endpoint to backend (`/api/v1/leads`)
2. ✅ Created API service (`services/api.ts`)
3. ✅ Updated App.tsx to fetch from backend
4. ✅ Added fallback to local database if backend unavailable

---

## 🚀 Quick Setup

### Step 1: Set API URL (Optional)

Create a `.env` file in the root of your project:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

**Or for production:**
```env
VITE_API_URL=https://your-backend-api.com/api/v1
```

**If you don't create .env, it defaults to `http://localhost:5000/api/v1`**

---

### Step 2: Start Backend

Make sure backend is running:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 CRM Backend Server Running!
🚀 Port: 5000
```

---

### Step 3: Start Frontend

In a new terminal:

```bash
npm run dev
```

---

### Step 4: View Leads in CRM

1. **Open CRM:** `http://localhost:3000`
2. **Login** (use any user)
3. **Go to "Leads" page**
4. **You should see leads from your website!** ✅

---

## 🔍 How It Works

```
Website Form Submission
    ↓
Backend Webhook (/api/v1/webhooks/lead)
    ↓
Stores lead in memory
    ↓
Frontend fetches (/api/v1/leads)
    ↓
Displays in CRM Leads page
```

---

## 📊 What You'll See

In the CRM Leads page, you'll see:
- ✅ Customer Name
- ✅ Mobile Number
- ✅ Email
- ✅ Source: "Chouhan Park View Website"
- ✅ Interested Project
- ✅ Interested Unit
- ✅ All other form data

---

## 🧪 Test It

1. **Submit a form** on your website
2. **Check backend console** - should see received lead
3. **Refresh CRM** (or it auto-refreshes)
4. **New lead appears** in Leads page! 🎉

---

## 🔄 Auto-Refresh (Optional)

To see new leads automatically, you can add polling:

```typescript
// In App.tsx, add this useEffect:
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, [loadData]);
```

---

## 🎯 Next Steps

Once you see leads in the frontend:

1. ✅ **Website → Backend → Frontend working** ← You are here!
2. **Add database** to store leads permanently (not just in memory)
3. **Connect Google Sheets** for sync
4. **Add real-time updates** (WebSocket or polling)

---

## 🆘 Troubleshooting

### Leads not showing?

1. **Check backend is running:**
   - Visit: `http://localhost:5000/health`
   - Should show: `{"status":"ok"}`

2. **Check leads endpoint:**
   - Visit: `http://localhost:5000/api/v1/leads`
   - Should show your leads in JSON

3. **Check browser console:**
   - Open F12 → Console
   - Look for errors

4. **Check API URL:**
   - Make sure `VITE_API_URL` is correct
   - Or it defaults to `http://localhost:5000/api/v1`

### CORS errors?

- Backend already has CORS enabled
- If still issues, check backend `src/index.js`

---

## ✅ Success!

If you see leads from your website in the CRM, **congratulations!** 🎊

Your complete flow is working:
- Website → Backend → Frontend ✅

**Next:** Add database to store leads permanently!








