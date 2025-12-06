# Website to CRM Integration
## Quick Setup for Chouhan Park View Website

This folder contains everything you need to connect your website (https://chouhan-park-view-xi.vercel.app/contact-us) to the CRM.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Copy Script to Your Website

1. Copy `crm-webhook-integration.js` to your Vercel project's `public` folder
2. Or add it directly to your website's HTML

### Step 2: Include Script in Your Contact Page

Add this before `</body>` tag in your contact page:

```html
<script src="/crm-webhook-integration.js"></script>
```

### Step 3: Update API URL

In `crm-webhook-integration.js`, change line 11:

```javascript
API_URL: 'https://your-backend-api.com/api/v1/webhooks/lead'
```

Replace `your-backend-api.com` with your actual backend URL.

---

## 📋 Files in This Folder

- **`crm-webhook-integration.js`** - Main integration script (add this to your website)
- **`INTEGRATION_GUIDE.md`** - Detailed step-by-step guide
- **`vercel-integration-example.html`** - Example HTML code

---

## ✅ How It Works

1. User fills out contact form on your website
2. Script automatically captures form submission
3. Data is sent to your CRM backend
4. Lead appears in CRM lead management system

---

## 🧪 Testing

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test locally:**
   - Update script to use `http://localhost:5000/api/v1/webhooks/lead`
   - Submit form on your website
   - Check backend console for received data

3. **Test on production:**
   - Deploy backend
   - Update script with production URL
   - Submit form on live website
   - Check backend logs

---

## 📞 Form Fields Mapping

Your website form → CRM:

| Website Field | CRM Field |
|--------------|-----------|
| Name | customerName |
| Email | email |
| Phone | mobile |
| Are you a broker? | metadata.is_broker |
| How did you hear about us? | modeOfEnquiry |
| Home type interested in? | interestedUnit |
| Project | interestedProject (auto: "Chouhan Park View") |

---

## 🔧 Customization

The script auto-detects your form, but if needed, you can customize field mapping in `mapFormDataToLead()` function.

---

## 📖 Full Documentation

See `INTEGRATION_GUIDE.md` for detailed instructions.

---

## 🆘 Troubleshooting

**Leads not appearing?**
- Check browser console (F12) for errors
- Check backend console for received data
- Verify API_URL is correct
- Check CORS settings in backend

**Need help?**
- Check `INTEGRATION_GUIDE.md` for detailed troubleshooting
- Verify form field names match expected names
- Test webhook directly with Postman first



