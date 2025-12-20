/**
 * Contact Form Handler
 * Handles contact form submissions (mock - saves to localStorage)
 * In production: POST /api/contact
 */

(function() {
  'use strict';

  const form = document.getElementById('messageForm');
  const successMessage = document.getElementById('successMessage');

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
   * Save message to localStorage (mock persistence)
   * In production: Send to API
   */
  function saveMessage(messageData) {
    try {
      const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
      messages.push({
        ...messageData,
        id: `MSG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'unread'
      });
      localStorage.setItem('contact_messages', JSON.stringify(messages));
      return true;
    } catch (e) {
      console.error('Error saving message:', e);
      return false;
    }
  }

  /**
   * Handle form submission
   */
  form.addEventListener('submit', function(e) {
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

    // Validation
    if (!name || name.length < 2) {
      showError('Please enter your full name (at least 2 characters)');
      nameInput.focus();
      return;
    }

    if (!phone || phone.replace(/[^\d]/g, '').length < 10) {
      showError('Please enter a valid phone number');
      phoneInput.focus();
      return;
    }

    if (!message || message.length < 10) {
      showError('Please enter a message (at least 10 characters)');
      messageInput.focus();
      return;
    }

    // Prepare message data
    const messageData = {
      name,
      phone,
      message,
      source: 'website_contact_form'
    };

    // Save message (mock - to localStorage)
    // In production: await fetch('/api/contact', { method: 'POST', body: JSON.stringify(messageData) })
    const saved = saveMessage(messageData);

    if (saved) {
      // Reset form
      form.reset();
      
      // Show success message
      showSuccess();

      // Log to console (for debugging)
      console.log('Contact message saved:', messageData);
    } else {
      showError('Failed to send message. Please try again or contact us directly via phone/WhatsApp.');
    }
  });
})();

