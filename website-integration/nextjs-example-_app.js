/**
 * Example: Next.js 12 Pages Router
 * File: pages/_app.js
 * 
 * Add this to your _app.js file
 */

import Script from 'next/script'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      
      {/* CRM Integration Script - Loads on all pages */}
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </>
  )
}

export default MyApp



