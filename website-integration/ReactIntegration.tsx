import { useEffect } from 'react';

/**
 * Chouhan Group CRM Integration for React (Vite / CRA)
 * 
 * INSTRUCTIONS:
 * 1. Copy this component into your components folder.
 * 2. Include <CRMIntegration /> in your main App.tsx file.
 * 3. Update SOURCE_NAME and DEFAULT_PROJECT for each website.
 */

export const CRMIntegration = () => {
    useEffect(() => {
        const handleCapture = async (e) => {
            const form = e.target;
            if (form.tagName !== 'FORM') return;

            const formData = new FormData(form);

            const firstName = formData.get('firstName') || '';
            const lastName = formData.get('lastName') || '';
            const combinedName = (firstName + ' ' + lastName).trim();

            const payload = {
                customerName: combinedName || formData.get('name') || formData.get('your-name') || 'Website Lead',
                mobile: formData.get('phone') || formData.get('your-tel') || formData.get('mobile') || '',
                email: formData.get('email') || formData.get('your-email') || '',
                source: 'Chouhan Group Website',
                interestedProject: 'General Inquiry',
                isBroker: formData.get('broker') || formData.get('Are you a broker?') || '',
                platform: formData.get('source') || formData.get('How did you hear about us?') || '',
                interestedUnit: formData.get('homeType') || formData.get('Home type interested in?') || '',
                remarks: 'Captured from React App: ' + window.location.pathname
            };

            if (payload.mobile || payload.customerName !== 'Website Lead') {
                try {
                    await fetch('https://chouhan-crm-backend-staging.onrender.com/api/v1/webhooks/lead', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    console.log('✅ Lead successfully sent to CRM');
                } catch (err) {
                    console.error('❌ CRM Error:', err);
                }
            }
        };

        document.addEventListener('submit', handleCapture);

        // Cleanup listener when component unmounts
        return () => document.removeEventListener('submit', handleCapture);
    }, []);

    return null; // This component registers the listener and renders nothing
};
