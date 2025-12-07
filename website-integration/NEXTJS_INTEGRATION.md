# Next.js Integration Guide
## Adding CRM Script to Your Next.js Vercel Project

Since you're using Next.js, you need to use Next.js's `Script` component instead of a regular `<script>` tag.

---

## 🚀 Step-by-Step Instructions

### Step 1: Copy Script to Public Folder

1. **Copy the script file:**
   - Copy `crm-integration.min.js` from this folder
   - Paste it into your Next.js project's `public` folder
   
   ```
   your-nextjs-project/
   └── public/
       └── crm-integration.min.js  ← Put it here
   ```

### Step 2: Add Script to Your App

You have **3 options** depending on your Next.js version:

---

## Option A: Next.js 13+ (App Router) - Recommended

If you're using the `app` directory structure:

### 2.1 Open `app/layout.js` or `app/layout.tsx`

```javascript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Add CRM Integration Script */}
        <Script 
          src="/crm-integration.min.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

**Or if you want it only on the contact page:**

Create `app/contact-us/page.js` (or your contact page):
```javascript
import Script from 'next/script'

export default function ContactPage() {
  return (
    <>
      {/* Your contact form content here */}
      
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </>
  )
}
```

---

## Option B: Next.js 12 (Pages Router)

If you're using the `pages` directory structure:

### 2.1 Open `pages/_app.js` or `pages/_app.tsx`

```javascript
import Script from 'next/script'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {/* Add CRM Integration Script */}
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </>
  )
}

export default MyApp
```

**Or if you want it only on the contact page:**

Create `pages/contact-us.js` (or your contact page):
```javascript
import Script from 'next/script'

export default function ContactUs() {
  return (
    <>
      {/* Your contact form content here */}
      
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </>
  )
}
```

---

## Option C: Add Directly to Contact Page Component

If your contact page is a component, add it there:

```javascript
import Script from 'next/script'

export default function ContactUsPage() {
  return (
    <div>
      {/* Your contact form */}
      <form>
        {/* form fields */}
      </form>
      
      {/* CRM Integration Script */}
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </div>
  )
}
```

---

## 📝 Complete Example (App Router)

Here's a complete example for Next.js 13+ App Router:

**`app/layout.js`:**
```javascript
import Script from 'next/script'
import './globals.css'

export const metadata = {
  title: 'Chouhan Park View',
  description: 'Contact us for property inquiries',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="/crm-integration.min.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

---

## 📝 Complete Example (Pages Router)

Here's a complete example for Next.js 12 Pages Router:

**`pages/_app.js`:**
```javascript
import Script from 'next/script'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </>
  )
}

export default MyApp
```

---

## ⚙️ Script Strategy Options

The `strategy` prop controls when the script loads:

- **`afterInteractive`** (Recommended) - Loads after page becomes interactive
- **`lazyOnload`** - Loads during idle time
- **`beforeInteractive`** - Loads before page becomes interactive (use sparingly)

**Use `afterInteractive` for the CRM script** - it's the best balance.

---

## 🔧 Step 3: Update API URL in Script

Before deploying, update the API URL in `public/crm-integration.min.js`:

1. **For local testing:**
   ```javascript
   API_URL: 'http://localhost:5000/api/v1/webhooks/lead'
   ```

2. **For production (after deploying backend):**
   ```javascript
   API_URL: 'https://your-backend-api.railway.app/api/v1/webhooks/lead'
   ```

---

## 🧪 Step 4: Test Locally

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Visit your contact page:**
   - Go to `http://localhost:3000/contact-us` (or your contact page URL)
   - Open browser console (F12)
   - You should see: `[CRM] Found X form(s)`

4. **Submit the form:**
   - Fill out and submit
   - Check backend console - should see received lead

---

## 🚀 Step 5: Deploy to Vercel

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add CRM integration script"
   git push
   ```

2. **Vercel will auto-deploy**

3. **After backend is deployed, update API URL:**
   - Edit `public/crm-integration.min.js`
   - Change to production backend URL
   - Commit and push again

---

## ✅ Verification Checklist

- [ ] Script file copied to `public/` folder
- [ ] Script added using Next.js `Script` component
- [ ] API URL updated in script
- [ ] Tested locally - form submission works
- [ ] Backend console shows received leads
- [ ] Deployed to Vercel
- [ ] Tested on production website

---

## 🔍 Troubleshooting

### Script not loading?
- Check browser console (F12) for errors
- Verify file is in `public/` folder
- Check Network tab - should see `crm-integration.min.js` loading

### Form not detected?
- Check browser console for `[CRM] Found X form(s)` message
- Verify form has `name`, `phone`, or `email` fields
- Check if form field names match what script expects

### Leads not sending?
- Check browser console for errors
- Verify API_URL is correct
- Check backend is running (for local) or deployed (for production)
- Check Network tab - should see POST request to webhook endpoint

### CORS errors?
- Backend already has CORS enabled
- If still issues, check backend `src/index.js` CORS settings
- Make sure backend allows your Vercel domain

---

## 📞 Need Help?

If you're stuck:
1. Check browser console (F12) for errors
2. Check backend console for received requests
3. Verify script is loading (Network tab)
4. Share error messages for help

---

## 🎯 Quick Reference

**File Structure:**
```
your-nextjs-project/
├── app/              (or pages/)
│   └── layout.js    ← Add Script here (App Router)
│   └── _app.js       ← Add Script here (Pages Router)
└── public/
    └── crm-integration.min.js  ← Script file
```

**Code to Add:**
```javascript
import Script from 'next/script'

<Script 
  src="/crm-integration.min.js" 
  strategy="afterInteractive"
/>
```

---

**That's it! Your Next.js site is now connected to the CRM! 🎉**




