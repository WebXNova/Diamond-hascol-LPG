/**
 * Page Events Handler
 * Handles order form submission and page-level events
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Get order form
  const form = document.getElementById('order-cylinder-form');
  if (!form) {
    console.warn('Order form not found');
    return;
  }

  // Get form elements with null checks
  const nameEl = document.getElementById('order-name');
  const phoneEl = document.getElementById('order-phone');
  const addressEl = document.getElementById('order-address');
  const qtyEl = document.getElementById('order-qty');
  const submitBtn = document.getElementById('order-submit-btn');

  // Verify required elements exist
  if (!nameEl || !phoneEl || !addressEl || !qtyEl || !submitBtn) {
    console.warn('Required form elements not found');
    return;
  }

  // Safe querySelector helper
  const safeQuerySelector = (selector, root = document) => {
    try {
      const result = root.querySelector(selector);
      return result || null;
    } catch (e) {
      console.warn('QuerySelector error:', e);
      return null;
    }
  };

  // Safe querySelectorAll helper
  const safeQuerySelectorAll = (selector, root = document) => {
    try {
      const result = root.querySelectorAll(selector);
      return result ? Array.from(result) : [];
    } catch (e) {
      console.warn('QuerySelectorAll error:', e);
      return [];
    }
  };

  // Safe length access helper
  const safeLength = (value) => {
    if (value === null || value === undefined) return 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') return value.length;
    if (typeof value.length === 'number') return value.length;
    return 0;
  };

  // Get selected cylinder type
  const getSelectedType = () => {
    const radios = safeQuerySelectorAll('input[name="cylinderType"]', form);
    for (const radio of radios) {
      if (radio && radio.checked) {
        return radio.value || '';
      }
    }
    return '';
  };

  // Get quantity
  const getQty = () => {
    const value = qtyEl.value;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    if (parsed > 999) return 999;
    return Math.floor(parsed);
  };

  // Validate form
  const validate = () => {
    const errors = [];

    const name = (nameEl.value || '').trim();
    if (safeLength(name) === 0) {
      errors.push({ field: 'name', message: 'Customer name is required.' });
    }

    const phone = (phoneEl.value || '').trim();
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (safeLength(phone) === 0) {
      errors.push({ field: 'phone', message: 'Phone number is required.' });
    } else if (safeLength(phoneDigits) < 7) {
      errors.push({ field: 'phone', message: 'Phone number looks too short.' });
    }

    const address = (addressEl.value || '').trim();
    if (safeLength(address) === 0) {
      errors.push({ field: 'address', message: 'Exact address is required.' });
    }

    const type = getSelectedType();
    if (safeLength(type) === 0) {
      errors.push({ field: 'type', message: 'Please select a cylinder type.' });
    }

    const qty = getQty();
    if (qty < 1 || qty > 999) {
      errors.push({ field: 'qty', message: 'Quantity must be between 1 and 999.' });
    }

    return errors;
  };

  // Submit order to backend
  const submitOrder = async (payload) => {
    try {
      // Normalize cylinderType
      let type = '';
      if (payload.cylinderType) {
        const lower = (payload.cylinderType || '').toLowerCase();
        if (lower === 'domestic' || lower === 'commercial') {
          type = lower.charAt(0).toUpperCase() + lower.slice(1);
        } else {
          type = (payload.cylinderType || '').charAt(0).toUpperCase() + (payload.cylinderType || '').slice(1).toLowerCase();
        }
      }

      // Ensure quantity is a number
      const quantity = typeof payload.quantity === 'number' 
        ? payload.quantity 
        : parseInt(payload.quantity || '1', 10);

      const requestBody = {
        customerName: payload.customerName || '',
        phone: payload.phone || '',
        address: payload.address || '',
        cylinderType: type,
        quantity: quantity,
        couponCode: payload.coupon && (payload.coupon || '').trim() ? (payload.coupon || '').trim().toUpperCase() : null,
      };

      console.log('📤 Sending order request:', requestBody);

      // Use centralized API config if available, otherwise use default
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('orders') 
        : 'http://localhost:5000/api/orders';

      console.log('🌐 API URL:', apiUrl);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', res.status, res.statusText);

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
          console.error('❌ API Error Response:', errorData);
        } catch (jsonError) {
          const text = await res.text().catch(() => 'No error details');
          console.error('❌ API Error (non-JSON):', text);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      let data;
      try {
        data = await res.json();
        console.log('✅ API Success Response:', data);
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }

      if (!data.success || !data.data) {
        console.error('❌ Invalid response structure:', data);
        throw new Error(data.error || 'Invalid response from server');
      }

      if (!data.data.orderId) {
        console.error('❌ Missing orderId in response:', data);
        throw new Error('Invalid response: missing order ID');
      }

      console.log('✅ Order created successfully:', data.data.orderId);

      return {
        orderId: data.data.orderId,
        status: data.data.status || 'pending',
        createdAt: data.data.createdAt ? new Date(data.data.createdAt) : new Date(),
        pricePerCylinder: data.data.pricePerCylinder || 0,
        subtotal: data.data.subtotal || 0,
        discount: data.data.discount || 0,
        totalPrice: data.data.totalPrice || 0,
        couponCode: data.data.couponCode || null
      };
    } catch (error) {
      console.error('❌ Order submission failed:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Validate form
    const errors = validate();
    if (safeLength(errors) > 0) {
      alert(errors[0].message);
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';

    try {
      const payload = {
        customerName: (nameEl.value || '').trim(),
        phone: (phoneEl.value || '').trim(),
        address: (addressEl.value || '').trim(),
        cylinderType: getSelectedType(),
        quantity: getQty(),
        coupon: null, // Add coupon support if needed
      };

      const result = await submitOrder(payload);
      console.log('✅ Order submitted successfully:', result);
      
      // Show success message
      alert(`Order confirmed! Order ID: ${result.orderId}`);
      
      // Reset form
      form.reset();
    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert(error.message || 'Failed to submit order. Please try again.');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  };

  // Attach submit handler
  form.addEventListener('submit', handleSubmit);
  console.log('✅ Order form submit handler attached');
});