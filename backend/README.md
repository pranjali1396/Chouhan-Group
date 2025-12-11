# CRM Backend - Webhook Testing

This is a minimal backend server to test if data from websites can reach the CRM.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Test the Webhook

#### Option A: Use the Test HTML Form
1. Open `test-website-form.html` in your browser
2. Fill in the form
3. Click "Submit Inquiry"
4. Check the backend console to see the received data

#### Option B: Use curl (Command Line)

```bash
curl -X POST http://localhost:5000/api/v1/webhooks/lead \
  -H "Content-Type: application/json" \
  -d '{
    "source": "Test Website",
    "sourceUrl": "https://example.com",
    "customerName": "John Doe",
    "mobile": "9876543210",
    "email": "john@example.com",
    "city": "Raipur",
    "interestedProject": "Chouhan Park View",
    "interestedUnit": "2 BHK Flat",
    "budget": "25-30 Lac",
    "purpose": "Self Use",
    "remarks": "Test lead from curl"
  }'
```

#### Option C: Use Postman
1. Create a new POST request
2. URL: `http://localhost:5000/api/v1/webhooks/lead`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "source": "Test Website",
  "customerName": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "interestedProject": "Chouhan Park View",
  "interestedUnit": "Flat"
}
```

## 📊 Check Received Leads

Visit: `http://localhost:5000/api/v1/webhooks/leads`

Or use curl:
```bash
curl http://localhost:5000/api/v1/webhooks/leads
```

## ✅ What to Check

1. **Backend Console**: Should show detailed logs of incoming requests
2. **Response**: Should return `{"success": true, "leadId": "..."}`
3. **No Errors**: Check for any error messages in console

## 🔍 Troubleshooting

### Server not starting?
- Check if port 5000 is already in use
- Change PORT in `.env` file

### CORS errors?
- Make sure CORS is enabled (it is by default)
- Check browser console for errors

### Data not received?
- Check backend console logs
- Verify the endpoint URL is correct
- Check network tab in browser dev tools

## 📝 Next Steps

Once you confirm data is being received:
1. ✅ Webhook is working
2. Next: Add database to store leads
3. Then: Connect to Google Sheets
4. Finally: Update frontend to use API








