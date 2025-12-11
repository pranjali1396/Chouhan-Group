/**
 * Example: Next.js 13+ App Router Layout
 * File: app/layout.js
 * 
 * Add this to your root layout file
 */

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
        
        {/* CRM Integration Script - Loads on all pages */}
        <Script 
          src="/crm-integration.min.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}








