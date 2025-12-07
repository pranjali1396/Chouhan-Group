/**
 * CRM Webhook Integration Script
 * Add this script to your website to send leads to the CRM
 * 
 * Usage:
 * 1. Include this script in your website
 * 2. Update the API_URL to point to your backend
 * 3. Call sendLeadToCRM() when form is submitted
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    // Update this to your backend API URL
    API_URL: 'http://localhost:5000/api/v1/webhooks/lead', // For local testing
    // API_URL: 'https://your-backend-api.com/api/v1/webhooks/lead', // For production
    
    // Your website name
    SOURCE_NAME: 'Chouhan Park View Website',
    
    // Enable console logging (set to false in production)
    DEBUG: true
  };

  /**
   * Log debug messages
   */
  function log(message, data = null) {
    if (CONFIG.DEBUG) {
      console.log('[CRM Integration]', message, data || '');
    }
  }

  /**
   * Map website form fields to CRM lead format
   */
  function mapFormDataToLead(formData) {
    // Extract form values
    const name = formData.get('name') || formData.get('Name') || formData.get('customerName') || '';
    const email = formData.get('email') || formData.get('Email') || '';
    const phone = formData.get('phone') || formData.get('Phone') || formData.get('mobile') || '';
    const broker = formData.get('broker') || formData.get('Are you a broker?') || '';
    const source = formData.get('source') || formData.get('How did you hear about us?') || '';
    const homeType = formData.get('homeType') || formData.get('Home type interested in?') || '';
    const message = formData.get('message') || formData.get('Message') || formData.get('remarks') || '';

    // Map home type to CRM unit types
    const unitTypeMap = {
      '1 Bedroom': 'Flat',
      '2 Bedroom': 'Flat',
      '3 Bedroom': 'Flat',
      '4 Bedroom': 'Flat',
      'Flat': 'Flat',
      'Bungalow': 'Bungalow',
      'Commercial': 'Commercial'
    };

    const interestedUnit = unitTypeMap[homeType] || homeType || 'Flat';

    // Map source to mode of enquiry
    const modeOfEnquiryMap = {
      'Google Search': 'Digital',
      'Social Media': 'Digital',
      'Newspaper': 'Digital',
      'Friend/Referral': 'Reference',
      'Advertisement': 'Digital',
      'Other': 'Digital'
    };

    const modeOfEnquiry = modeOfEnquiryMap[source] || 'Digital';

    // Build lead object
    const leadData = {
      source: CONFIG.SOURCE_NAME,
      sourceUrl: window.location.origin + window.location.pathname,
      customerName: name.trim(),
      mobile: phone.trim(),
      email: email.trim(),
      city: 'Bhilai', // Default or extract from form if available
      interestedProject: 'Chouhan Park View',
      interestedUnit: interestedUnit,
      modeOfEnquiry: modeOfEnquiry,
      remarks: message.trim() || `Inquiry from ${CONFIG.SOURCE_NAME}. Source: ${source}. Home type: ${homeType}. Broker: ${broker}`,
      metadata: {
        utm_source: getUrlParameter('utm_source'),
        utm_campaign: getUrlParameter('utm_campaign'),
        utm_medium: getUrlParameter('utm_medium'),
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        is_broker: broker === 'Yes' || broker === 'yes',
        lead_source: source,
        home_type: homeType
      }
    };

    return leadData;
  }

  /**
   * Get URL parameter value
   */
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || '';
  }

  /**
   * Send lead data to CRM
   */
  async function sendLeadToCRM(leadData) {
    try {
      log('Sending lead to CRM...', leadData);

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        log('✅ Lead sent successfully!', result);
        return {
          success: true,
          leadId: result.leadId,
          message: 'Thank you! We will contact you soon.'
        };
      } else {
        log('❌ Error sending lead:', result);
        return {
          success: false,
          error: result.error || 'Failed to submit. Please try again.'
        };
      }
    } catch (error) {
      log('❌ Network error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  /**
   * Auto-detect and intercept form submissions
   */
  function autoDetectForm() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    function init() {
      // Find all forms on the page
      const forms = document.querySelectorAll('form');
      
      log(`Found ${forms.length} form(s) on the page`);

      forms.forEach((form, index) => {
        log(`Setting up form ${index + 1}`, form);

        form.addEventListener('submit', async function(e) {
          // Don't prevent default immediately - let the form validate first
          const formData = new FormData(form);
          
          // Check if this looks like a contact/lead form
          const hasName = formData.has('name') || formData.has('Name') || formData.has('customerName');
          const hasPhone = formData.has('phone') || formData.has('Phone') || formData.has('mobile');
          const hasEmail = formData.has('email') || formData.has('Email');

          if (hasName || hasPhone || hasEmail) {
            log('Contact form detected, sending to CRM...');

            // Map form data to lead format
            const leadData = mapFormDataToLead(formData);

            // Send to CRM (don't wait for response to avoid blocking form submission)
            sendLeadToCRM(leadData).then(result => {
              if (result.success) {
                log('Lead successfully sent to CRM');
                // Optionally show success message
                showNotification('Thank you! We will contact you soon.', 'success');
              } else {
                log('Failed to send lead to CRM:', result.error);
                // Don't show error to user - form submission should still work
              }
            }).catch(error => {
              log('Error sending lead:', error);
            });
          }
        });
      });
    }
  }

  /**
   * Show notification to user
   */
  function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Manual function to send lead (for custom implementations)
   */
  window.sendLeadToCRM = function(formData) {
    const leadData = mapFormDataToLead(formData);
    return sendLeadToCRM(leadData);
  };

  /**
   * Initialize auto-detection
   */
  if (typeof window !== 'undefined') {
    autoDetectForm();
    log('CRM Integration initialized');
  }

})();




