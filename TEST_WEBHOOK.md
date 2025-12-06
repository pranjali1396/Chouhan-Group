# Testing Webhook - Step by Step Guide

## 🎯 Goal
Test if data from websites can reach your CRM backend.

---

## Step 1: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

You should see:
```
🚀 CRM Backend Server Running!
🚀 Port: 5000
🚀 Webhook Endpoint: http://localhost:5000/api/v1/webhooks/lead
```

---

## Step 2: Test with HTML Form (Easiest)

1. **Open the test form:**
   - Open `test-website-form.html` in your browser
   - Or double-click the file

2. **Fill in the form:**
   - Customer Name: "Test Customer"
   - Mobile: "9876543210"
   - Select a project and unit type
   - Click "Submit Inquiry"

3. **Check Results:**
   - ✅ **Success message** appears on the form
   - ✅ **Backend console** shows the received data
   - ✅ **Response** includes a leadId

---

## Step 3: Verify Data Reception

### Check Backend Console
You should see something like:
```
✅ ===== LEAD RECEIVED FROM WEBSITE =====
📋 Lead Data: {
  "source": "Test Website",
  "customerName": "Test Customer",
  "mobile": "9876543210",
  ...
}
⏰ Received at: 2025-12-05T...
🌐 Source: Test Website
==========================================
```

### Check Response
The form should show:
```json
{
  "success": true,
  "message": "Lead received successfully!",
  "leadId": "lead-1234567890-abc123",
  ...
}
```

---

## Step 4: Test with curl (Alternative)

Open a new terminal and run:

```bash
curl -X POST http://localhost:5000/api/v1/webhooks/lead \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"Test Website\",\"customerName\":\"John Doe\",\"mobile\":\"9876543210\",\"email\":\"john@example.com\",\"interestedProject\":\"Chouhan Park View\"}"
```

You should see a JSON response with `"success": true`

---

## Step 5: View All Received Leads

Visit in browser or use curl:
```bash
curl http://localhost:5000/api/v1/webhooks/leads
```

---

## ✅ Success Criteria

- [ ] Backend server starts without errors
- [ ] Form submission shows success message
- [ ] Backend console logs show received data
- [ ] Response includes `"success": true`
- [ ] Lead ID is generated

---

## ❌ Troubleshooting

### Problem: "Cannot connect to server"
**Solution:** 
- Make sure backend is running (`npm run dev` in backend folder)
- Check if port 5000 is available

### Problem: CORS error in browser
**Solution:**
- CORS is already enabled in the server
- If still getting errors, check browser console for details

### Problem: No data in console
**Solution:**
- Check if request reached server (look for `POST /api/v1/webhooks/lead` log)
- Verify JSON format is correct
- Check network tab in browser dev tools

### Problem: 404 Not Found
**Solution:**
- Verify URL: `http://localhost:5000/api/v1/webhooks/lead`
- Check if server is running on correct port

---

## 🎉 Once It Works

When you see data in the backend console, **congratulations!** 🎊

The webhook is working. Next steps:
1. ✅ Webhook receives data (DONE)
2. Next: Add database to store leads permanently
3. Then: Connect Google Sheets sync
4. Finally: Update frontend to use API

---

## 📞 Need Help?

Check:
- Backend console logs
- Browser console (F12)
- Network tab in browser dev tools
- Server is running on correct port



