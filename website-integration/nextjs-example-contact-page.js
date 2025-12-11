/**
 * Example: Contact Page Only (App Router)
 * File: app/contact-us/page.js
 * 
 * If you only want the script on the contact page
 */

import Script from 'next/script'

export default function ContactUsPage() {
  return (
    <div className="contact-page">
      <h1>Contact Us</h1>
      
      {/* Your contact form */}
      <form id="contactForm">
        <input type="text" name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="tel" name="phone" placeholder="Phone" required />
        <select name="broker">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
        <select name="source">
          <option value="Google Search">Google Search</option>
          <option value="Social Media">Social Media</option>
          {/* ... other options */}
        </select>
        <select name="homeType">
          <option value="Flat">Flat</option>
          <option value="Bungalow">Bungalow</option>
          {/* ... other options */}
        </select>
        <button type="submit">Submit</button>
      </form>
      
      {/* CRM Integration Script - Only loads on this page */}
      <Script 
        src="/crm-integration.min.js" 
        strategy="afterInteractive"
      />
    </div>
  )
}








