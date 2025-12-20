/**
 * Contact Form Handler
 * Handles contact form submissions via REST API
 * POST /api/contact
 */

(function() {
  'use strict';

  const form = document.getElementById('messageForm');
  const successMessage = document.getElementById('successMessage');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  /**
   * Show success message
   */
  function showSuccess() {
    if (successMessage) {
      successMessage.style.display = 'block';
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Hide after 5 seconds
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Handle form submission
   */
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');

    if (!nameInput || !phoneInput || !messageInput) {
      showError('Form fields not found. Please refresh the page.');
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const message = messageInput.value.trim();

    // Client-side validation (backend also validates)
    if (!name || name.length < 2) {
      showError('Please enter your full name (at least 2 characters)');
      nameInput.focus();
      return;
    }

    if (!phone || phone.replace(/[^\d]/g, '').length < 7) {
      showError('Please enter a valid phone number');
      phoneInput.focus();
      return;
    }

    if (!message || message.length < 10) {
      showError('Please enter a message (at least 10 characters)');
      messageInput.focus();
      return;
    }

    // Disable submit button during request
    const originalButtonText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    // Prepare message data (send only required fields)
    const messageData = {
      name,
      phone,
      message,
    };

    try {
      // Use centralized API config if available, otherwise use default
      const apiUrl = window.getApiUrl ? window.getApiUrl('contact') : 'http://localhost:5000/api/contact';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reset form
        form.reset();
        
        // Show success message
        showSuccess();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Contact form submission failed:', error);
      showError(error.message || 'Failed to send message. Please try again or contact us directly via phone/WhatsApp.');
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
})();

