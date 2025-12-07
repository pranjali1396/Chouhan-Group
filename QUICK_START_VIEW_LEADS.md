# Quick Start: View Leads from Website in CRM

## ✅ What's Done

1. ✅ Backend receives leads from website
2. ✅ Backend has GET endpoint (`/api/v1/leads`)
3. ✅ Frontend API service created
4. ✅ Frontend updated to fetch from backend

---

## 🚀 3 Simple Steps to See Leads

### Step 1: Start Backend

```bash
cd backend
npm run dev
```

**You should see:**
```
🚀 CRM Backend Server Running!
🚀 Port: 5000
```

### Step 2: Start Frontend

In a **new terminal**:

```bash
npm run dev
```

**Frontend will start on:** `http://localhost:3000`

### Step 3: View Leads

1. **Open CRM:** `http://localhost:3000`
2. **Login** (use any user - Admin or Salesperson)
3. **Click "Leads"** in the sidebar
4. **You'll see leads from your website!** ✅

---

## 📊 What You'll See

In the Leads page:
- ✅ Customer Name (from website form)
- ✅ Mobile Number
- ✅ Email
- ✅ Source: "Chouhan Park View Website"
- ✅ Interested Project: "Chouhan Park View"
- ✅ Interested Unit (Flat/Bungalow/etc.)
- ✅ Mode of Enquiry
- ✅ All form data

---

## 🧪 Test It Now

1. **Submit a form** on your website (or use test form)
2. **Check backend console** - should see:
   ```
   ✅ ===== LEAD RECEIVED FROM WEBSITE =====
   ```
3. **Refresh CRM** (or wait a moment)
4. **New lead appears** in Leads page! 🎉

---

## 🔄 Auto-Refresh

The CRM will show leads when you:
- Refresh the page
- Navigate to Leads page
- Or add auto-refresh (see below)

**To add auto-refresh every 30 seconds:**

The code already tries to fetch from backend. To make it refresh automatically, you can add this to `App.tsx`:

```typescript
// Add this useEffect after loadData
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, [loadData]);
```

---

## 🎯 Complete Flow

```
Website Form
    ↓
Backend Webhook (/api/v1/webhooks/lead)
    ↓
Stored in Backend
    ↓
Frontend Fetches (/api/v1/leads)
    ↓
Shows in CRM Leads Page ✅
```

---

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can see leads in CRM Leads page
- [ ] New website submissions appear in CRM

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
   - Look for errors or warnings

4. **Check if leads were received:**
   - Check backend console for "LEAD RECEIVED" messages
   - Visit: `http://localhost:5000/api/v1/webhooks/leads`

### Still not working?

- Make sure you submitted a form on the website
- Check backend console for received leads
- Verify API URL is `http://localhost:5000/api/v1` (default)

---

## 🎉 Success!

If you see leads from your website in the CRM, **everything is working!** 🎊

**Next Steps:**
1. ✅ Website → Backend → Frontend (DONE!)
2. ⏭️ Add database to store leads permanently
3. ⏭️ Connect Google Sheets
4. ⏭️ Add real-time updates

---

**Try it now! Start both servers and check the Leads page!** 🚀




