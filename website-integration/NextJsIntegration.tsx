import Script from 'next/script';

/**
 * Chouhan Group CRM Integration for Next.js
 * 
 * INSTRUCTIONS:
 * 1. Copy this component into your project (e.g., components/CRMIntegration.tsx)
 * 2. Import it in your root app/layout.tsx file
 * 3. Update SOURCE_NAME and DEFAULT_PROJECT for each website.
 */

export const CRMIntegration = () => {
    return (
        <Script id="chouhan-crm-capture" strategy="afterInteractive">
            {`
        (function() {
          const CRM_CONFIG = {
            API_URL: 'https://chouhan-crm-backend-staging.onrender.com/api/v1/webhooks/lead',
            SOURCE_NAME: 'Sunrise City Website', // CHANGE THIS for each site
            DEFAULT_PROJECT: 'Sunrise City'      // CHANGE THIS for each site
          };

          const handleFormSubmit = async (e) => {
            const form = e.target;
            if (form.tagName !== 'FORM') return;

            const formData = new FormData(form);
            
            // Smarter field detection
            const firstName = formData.get('firstName') || formData.get('first-name') || '';
            const lastName = formData.get('lastName') || formData.get('last-name') || '';
            const combinedName = (firstName + ' ' + lastName).trim();

            const payload = {
              customerName: combinedName || formData.get('name') || formData.get('your-name') || formData.get('customerName') || 'Website Lead',
              mobile: formData.get('phone') || formData.get('your-tel') || formData.get('mobile') || formData.get('mobile-number') || '',
              email: formData.get('email') || formData.get('your-email') || '',
              source: CRM_CONFIG.SOURCE_NAME,
              interestedProject: CRM_CONFIG.DEFAULT_PROJECT,
              remarks: 'Enquiry from ' + window.location.hostname + window.location.pathname
            };

            // Only send if there is at least a phone number or name
            if (payload.mobile || payload.customerName !== 'Website Lead') {
              try {
                const response = await fetch(CRM_CONFIG.API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                if (response.ok) console.log('✅ Lead captured by CRM');
              } catch (err) {
                console.error('❌ CRM Error:', err);
              }
            }
          };

          // Attach listener to the whole document to catch all forms
          document.addEventListener('submit', handleFormSubmit);
        })();
      `}
        </Script>
    );
};
