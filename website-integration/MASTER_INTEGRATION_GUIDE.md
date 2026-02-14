# 🚀 Chouhan Group CRM - Website Integration Guide

This folder contains the code needed to connect all your external Chouhan Group websites to your new CRM.

## 🔗 Connection Details
- **Backend URL:** `https://chouhan-crm-backend-staging.onrender.com`
- **Database:** cPanel MySQL (`chouhangroup_chouhan_crm`)

---

## 🏗️ 1. Next.js Integration
If your website is built with **Next.js (App Router)**:
1. Copy the file `./NextJsIntegration.tsx` to your project.
2. In your `app/layout.tsx`, import and add the component:
   ```tsx
   import { CRMIntegration } from '@/components/CRMIntegration';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <CRMIntegration />
         </body>
       </html>
     );
   }
   ```

---

## ⚛️ 2. React Integration (Vite/CRA)
If your website is built with standard **React**:
1. Copy `./ReactIntegration.tsx` to your project.
2. In your `App.tsx`, import and add the component:
   ```tsx
   import { CRMIntegration } from './components/ReactIntegration';

   function App() {
     return (
       <div>
         <CRMIntegration />
         <YourOtherComponents />
       </div>
     );
   }
   ```

---

## 📝 Configuration (Important!)
In each website, open the integration file and change these two values:
- `SOURCE_NAME`: Set this to the name of the website (e.g., 'Sunrise City Website').
- `DEFAULT_PROJECT`: Set this to the main project the site is about (e.g., 'Sunrise City').

---

## ✅ How it Works
The script automatically listens for **any form submission** on your website. It looks for fields with these names:
- `name`, `your-name`, `customerName`, `userName`
- `phone`, `mobile`, `your-tel`
- `email`, `your-email`

When a user clicks "Submit", the data is instantly sent to your CRM and saved in your cPanel database.
