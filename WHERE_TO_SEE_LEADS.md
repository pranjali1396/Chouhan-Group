# Where to See Leads from Website

## 📍 Exact Location in CRM

### Step 1: Open the CRM

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Step 2: Login

- Use any user (Admin or any Salesperson)
- Click "Login"

### Step 3: Navigate to Leads Page

**You have 3 ways to get to the Leads page:**

#### Option A: Sidebar (Left Side)
- Look at the **left sidebar**
- Click on **"Leads"** or **"Opportunities"** or **"Clients"**
- These all show leads, just filtered differently

#### Option B: Bottom Navigation Bar (Mobile)
- Look at the **bottom navigation bar**
- Click the **"Leads"** icon (usually first or second icon)

#### Option C: Dashboard
- On the Dashboard, you'll see lead cards/statistics
- Click on any lead card to go to Leads page

---

## 📊 What You'll See

Once you're on the **Leads page**, you'll see:

### Lead List View
- **Table/List of all leads**
- Each lead shows:
  - Customer Name
  - Mobile Number
  - Email
  - Status (New, Qualified, etc.)
  - Assigned Salesperson
  - Last Activity Date
  - Source (should show "Chouhan Park View Website")

### Tabs at Top
- **"All"** - Shows all leads
- **"New"** - Shows new leads (your website leads will be here!)
- **"Qualified"** - Qualified leads
- **"Site Visit Scheduled"** - Leads with scheduled visits
- **"Site Visit Done"** - Completed visits
- **"Booking"** - Booked leads
- **"Lost"** - Lost leads

---

## 🎯 Where Website Leads Appear

**Website leads will appear:**
1. ✅ In the **"All"** tab (all leads)
2. ✅ In the **"New"** tab (new leads from website)
3. ✅ At the **top of the list** (newest first)
4. ✅ With **Source: "Chouhan Park View Website"**

---

## 🔍 How to Identify Website Leads

Look for these indicators:

1. **Source Column:**
   - Should show: "Chouhan Park View Website"
   - Or check the lead details

2. **Status:**
   - Usually "New" for fresh website leads

3. **Interested Project:**
   - Should show: "Chouhan Park View"

4. **Recent Date:**
   - Lead Date will be today's date
   - Last Activity Date will be recent

---

## 📱 Visual Guide

```
┌─────────────────────────────────────┐
│  CRM Header                          │
├─────────────────────────────────────┤
│  [Sidebar]  │  Main Content Area    │
│             │                       │
│  Dashboard  │  ┌─────────────────┐ │
│  Leads ←───┼──│  Leads Page      │ │
│  Calendar   │  │                 │ │
│  Reports    │  │  [All] [New]   │ │
│  Tasks      │  │                 │ │
│  Settings   │  │  Lead 1 ← New!  │ │
│             │  │  Lead 2          │ │
│             │  │  Lead 3          │ │
│             │  └─────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🧪 Quick Test

1. **Submit a test form** on your website
2. **Go to CRM:** `http://localhost:3000`
3. **Login**
4. **Click "Leads"** in sidebar
5. **Click "New" tab**
6. **Look at the top** - your new lead should be there!

---

## 🔄 If Leads Don't Show

### Check 1: Backend Running?
```bash
cd backend
npm run dev
```
Visit: `http://localhost:5000/health` - should show `{"status":"ok"}`

### Check 2: Leads Received?
Visit: `http://localhost:5000/api/v1/leads` - should show your leads in JSON

### Check 3: Frontend Connected?
- Open browser console (F12)
- Look for errors
- Check Network tab - should see request to `/api/v1/leads`

### Check 4: Refresh Page
- Sometimes you need to refresh the Leads page
- Or navigate away and back to Leads

---

## 📍 Exact Navigation Path

```
1. Open: http://localhost:3000
2. Login (any user)
3. Click "Leads" in left sidebar
4. Click "New" tab at top
5. Look at the list - website leads are at the top!
```

---

## ✅ Success Indicators

You'll know it's working when you see:
- ✅ Leads appear in the Leads page
- ✅ Source shows "Chouhan Park View Website"
- ✅ Interested Project shows "Chouhan Park View"
- ✅ Lead Date is recent (today)
- ✅ Status is "New"

---

**The leads are in the "Leads" page, in the "New" tab, at the top of the list!** 🎯




