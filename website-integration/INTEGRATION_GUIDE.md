# Website Integration Guide
## Connecting Chouhan Park View Website to CRM

This guide shows you how to integrate your website (https://chouhan-park-view-xi.vercel.app/contact-us) with the CRM to automatically capture leads.

---

## 🎯 What This Does

When someone fills out the contact form on your website, the lead data will automatically be sent to your CRM backend and appear in the lead management system.

---

## 📋 Step-by-Step Integration

### Option 1: Add Script to Vercel Website (Recommended)

#### Step 1: Update the Script Configuration

1. Open `website-integration/crm-webhook-integration.js`
2. Update the `API_URL` to your backend URL:
   ```javascript
   API_URL: 'https://your-backend-api.com/api/v1/webhooks/lead'
   ```

#### Step 2: Add Script to Your Website

**If you have access to the website code:**

1. **Find your contact form HTML** (usually in a component or page file)
2. **Add the script before the closing `</body>` tag:**

```html
<!-- CRM Integration Script -->
<script src="https://your-cdn-url.com/crm-webhook-integration.js"></script>
<!-- OR inline the script -->
<script>
  // Paste the entire content of crm-webhook-integration.js here
</script>
```

**For Vercel/Next.js:**

1. If using Next.js, add to `pages/_app.js` or `app/layout.js`:
```javascript
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script src="/crm-webhook-integration.js" strategy="afterInteractive" />
    </>
  );
}
```

2. Place `crm-webhook-integration.js` in the `public` folder

#### Step 3: Update Form Field Names (if needed)

The script looks for these form field names:
- `name` or `Name` or `customerName`
- `email` or `Email`
- `phone` or `Phone` or `mobile`
- `broker` or `Are you a broker?`
- `source` or `How did you hear about us?`
- `homeType` or `Home type interested in?`
- `message` or `Message` or `remarks`

**If your form uses different names**, update the `mapFormDataToLead()` function in the script.

---

### Option 2: Manual Integration (Custom Form Handler)

If you have a custom form submission handler, use this:

```javascript
// In your form submission handler
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  
  // Send to your existing form handler (if any)
  // ... your existing code ...
  
  // Also send to CRM
  const leadData = {
    source: 'Chouhan Park View Website',
    sourceUrl: window.location.href,
    customerName: formData.get('name'),
    mobile: formData.get('phone'),
    email: formData.get('email'),
    interestedProject: 'Chouhan Park View',
    interestedUnit: formData.get('homeType'),
    remarks: `Source: ${formData.get('source')}, Broker: ${formData.get('broker')}`
  };

  try {
    const response = await fetch('https://your-backend-api.com/api/v1/webhooks/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();
    console.log('Lead sent to CRM:', result);
  } catch (error) {
    console.error('Error sending to CRM:', error);
    // Don't block form submission if CRM fails
  }
}
```

---

## 🔍 Testing the Integration

### Step 1: Start Your Backend

```bash
cd backend
npm run dev
```

### Step 2: Test Locally

1. **Update the script** to use local URL:
   ```javascript
   API_URL: 'http://localhost:5000/api/v1/webhooks/lead'
   ```

2. **Open your website locally** or use a tool like ngrok to expose localhost:
   ```bash
   npx ngrok http 5000
   ```

3. **Submit the contact form** on your website

4. **Check backend console** - you should see:
   ```
   ✅ ===== LEAD RECEIVED FROM WEBSITE =====
   📋 Lead Data: { ... }
   ```

### Step 3: Test on Production

1. **Deploy your backend** to a hosting service (Railway, Render, etc.)
2. **Update API_URL** in the script to production URL
3. **Deploy updated website** to Vercel
4. **Submit a test form** on the live website
5. **Check backend logs** to confirm receipt

---

## 📊 Form Field Mapping

Your website form fields → CRM fields:

| Website Field | CRM Field | Notes |
|--------------|-----------|-------|
| Name | customerName | Required |
| Email | email | Optional |
| Phone | mobile | Required |
| Are you a broker? | metadata.is_broker | Yes/No |
| How did you hear about us? | modeOfEnquiry | Mapped to Digital/Reference |
| Home type interested in? | interestedUnit | Mapped to Flat/Bungalow/Commercial |
| (Any message) | remarks | Optional |

---

## 🔧 Customization

### Change Project Name

If leads come from different projects, update in the script:
```javascript
interestedProject: 'Chouhan Park View', // Change this
```

### Add Custom Fields

To capture additional form fields, update `mapFormDataToLead()`:

```javascript
const leadData = {
  // ... existing fields ...
  customField1: formData.get('yourCustomField'),
  metadata: {
    // ... existing metadata ...
    customData: formData.get('customField')
  }
};
```

---

## 🚨 Troubleshooting

### Leads Not Appearing in CRM

1. **Check browser console** (F12) for errors
2. **Check backend logs** - is the webhook being called?
3. **Verify API_URL** is correct
4. **Check CORS** - backend should allow your website domain

### CORS Errors

If you see CORS errors, update backend `src/index.js`:

```javascript
app.use(cors({
  origin: [
    'https://chouhan-park-view-xi.vercel.app',
    'http://localhost:3000',
    // Add other allowed origins
  ],
  credentials: true
}));
```

### Form Not Detected

If auto-detection doesn't work:
1. Check form field names match expected names
2. Manually call `sendLeadToCRM()` in your form handler
3. Check browser console for debug messages

---

## 🔒 Security (Production)

Before going live:

1. **Use HTTPS** for API URL
2. **Add API key authentication** (update backend to require API key)
3. **Enable rate limiting** on backend
4. **Validate all inputs** on backend
5. **Set DEBUG to false** in production

---

## 📝 Next Steps

Once integration is working:

1. ✅ Leads from website appear in CRM
2. Next: Add database to store leads permanently
3. Then: Set up Google Sheets sync
4. Finally: Add real-time updates in CRM frontend

---

## 🆘 Need Help?

- Check backend console logs
- Check browser console (F12)
- Verify form field names match
- Test with curl/Postman first
- Check network tab in browser dev tools

---

## 📞 Support

If you need help:
1. Share backend console logs
2. Share browser console errors
3. Share form HTML structure
4. Test webhook directly with Postman first




