/**
 * Coupons Management Module
 * Handles coupons list, create, edit, delete operations
 * 
 * NOTE: Currently uses localStorage for persistence. Backend integration points are marked.
 */

import { mockCoupons } from '../../data/mock-data.js';

/**
 * Load coupons from localStorage or use mock data
 * In production: Replace with API call - GET /api/admin/coupons
 */
function loadCoupons() {
  const saved = localStorage.getItem('admin_coupons');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading coupons from localStorage:', e);
      return [...mockCoupons];
    }
  }
  return [...mockCoupons];
}

/**
 * Save coupons to localStorage (mock persistence)
 * In production: Replace with API calls for individual operations
 */
function saveCoupons() {
  try {
    localStorage.setItem('admin_coupons', JSON.stringify(currentCoupons));
  } catch (e) {
    console.error('Error saving coupons to localStorage:', e);
    showNotification('Failed to save coupon. Please try again.', 'error');
  }
}

let currentCoupons = loadCoupons();

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

/**
 * Check if coupon is expired
 */
function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

/**
 * Format coupon value
 */
function formatCouponValue(coupon) {
  if (coupon.type === 'percentage') {
    return `${coupon.value}%`;
  } else {
    return `₨${coupon.value}`;
  }
}

/**
 * Render coupons table
 */
function renderCoupons() {
  const tableBody = document.getElementById('coupons-table-body');
  if (!tableBody) return;

  if (currentCoupons.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          No coupons found. Create your first coupon!
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = currentCoupons.map(coupon => {
    const expired = isExpired(coupon.expiresAt);
    const usagePercent = (coupon.usageCount / coupon.usageLimit) * 100;

    return `
      <tr>
        <td><strong>${coupon.code}</strong></td>
        <td>${formatCouponValue(coupon)}</td>
        <td>${coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
        <td>${coupon.minPurchase > 0 ? `₨${coupon.minPurchase.toLocaleString()}` : 'None'}</td>
        <td>${coupon.maxDiscount > 0 ? `₨${coupon.maxDiscount.toLocaleString()}` : 'Unlimited'}</td>
        <td>
          <span class="admin-badge ${expired ? 'admin-badge--cancelled' : coupon.isActive ? 'admin-badge--delivered' : 'admin-badge--pending'}">
            ${expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div style="font-size: var(--fs-0);">
            <div>${coupon.usageCount} / ${coupon.usageLimit}</div>
            <div style="width: 100px; height: 4px; background: var(--bg-2); border-radius: 2px; margin-top: 0.25rem; overflow: hidden;">
              <div style="width: ${Math.min(usagePercent, 100)}%; height: 100%; background: var(--color-brand); transition: width 0.3s;"></div>
            </div>
          </div>
        </td>
        <td>${formatDate(coupon.expiresAt)}</td>
        <td>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="admin-btn admin-btn--secondary" onclick="editCoupon('${coupon.id}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
              Edit
            </button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCoupon('${coupon.id}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Open create coupon modal
 */
window.openCreateCoupon = function() {
  const modal = document.getElementById('coupon-form-modal');
  const form = document.getElementById('coupon-form');
  const modalTitle = document.getElementById('coupon-form-title');
  
  if (!modal || !form || !modalTitle) {
    console.error('Coupon form elements not found');
    showNotification('Error: Form elements not found', 'error');
    return;
  }
  
  modalTitle.textContent = 'Create New Coupon';
  form.reset();
  form.dataset.couponId = '';
  
  // Set default values
  const codeInput = document.getElementById('coupon-code');
  const typeSelect = document.getElementById('coupon-type');
  const valueInput = document.getElementById('coupon-value');
  const minPurchaseInput = document.getElementById('coupon-min-purchase');
  const maxDiscountInput = document.getElementById('coupon-max-discount');
  const usageLimitInput = document.getElementById('coupon-usage-limit');
  const expiresInput = document.getElementById('coupon-expires-at');
  const isActiveCheckbox = document.getElementById('coupon-is-active');
  
  if (codeInput) codeInput.value = '';
  if (typeSelect) typeSelect.value = 'percentage';
  if (valueInput) valueInput.value = '';
  if (minPurchaseInput) minPurchaseInput.value = '0';
  if (maxDiscountInput) maxDiscountInput.value = '';
  if (usageLimitInput) usageLimitInput.value = '100';
  if (expiresInput) {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    expiresInput.value = '';
    expiresInput.min = today;
  }
  if (isActiveCheckbox) isActiveCheckbox.checked = true;
  
  // Show max discount field for percentage type
  toggleCouponTypeFields();
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

/**
 * Edit coupon
 */
window.editCoupon = function(couponId) {
  const coupon = currentCoupons.find(c => c.id === couponId);
  if (!coupon) {
    showNotification('Coupon not found', 'error');
    return;
  }

  const modal = document.getElementById('coupon-form-modal');
  const form = document.getElementById('coupon-form');
  const modalTitle = document.getElementById('coupon-form-title');
  
  if (!modal || !form || !modalTitle) {
    console.error('Coupon form elements not found');
    showNotification('Error: Form elements not found', 'error');
    return;
  }
  
  modalTitle.textContent = 'Edit Coupon';
  form.dataset.couponId = couponId;
  
  // Populate form
  const codeInput = document.getElementById('coupon-code');
  const typeSelect = document.getElementById('coupon-type');
  const valueInput = document.getElementById('coupon-value');
  const minPurchaseInput = document.getElementById('coupon-min-purchase');
  const maxDiscountInput = document.getElementById('coupon-max-discount');
  const usageLimitInput = document.getElementById('coupon-usage-limit');
  const expiresInput = document.getElementById('coupon-expires-at');
  const isActiveCheckbox = document.getElementById('coupon-is-active');
  
  if (codeInput) codeInput.value = coupon.code;
  if (typeSelect) typeSelect.value = coupon.type;
  if (valueInput) valueInput.value = coupon.value;
  if (minPurchaseInput) minPurchaseInput.value = coupon.minPurchase || 0;
  if (maxDiscountInput) maxDiscountInput.value = coupon.maxDiscount || 0;
  if (usageLimitInput) usageLimitInput.value = coupon.usageLimit;
  if (expiresInput) {
    const date = new Date(coupon.expiresAt);
    expiresInput.value = date.toISOString().split('T')[0];
    expiresInput.min = new Date().toISOString().split('T')[0];
  }
  if (isActiveCheckbox) isActiveCheckbox.checked = coupon.isActive;
  
  // Show/hide max discount field
  toggleCouponTypeFields();
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
};

/**
 * Delete coupon
 * In production: DELETE /api/admin/coupons/:id
 */
window.deleteCoupon = function(couponId) {
  const coupon = currentCoupons.find(c => c.id === couponId);
  if (!coupon) {
    showNotification('Coupon not found', 'error');
    return;
  }

  if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  const index = currentCoupons.findIndex(c => c.id === couponId);
  if (index > -1) {
    currentCoupons.splice(index, 1);
    saveCoupons(); // Save to localStorage
    renderCoupons();
    showNotification(`Coupon "${coupon.code}" deleted successfully`, 'success');
  }
};

/**
 * Save coupon (create or update)
 * In production: 
 *   - Create: POST /api/admin/coupons
 *   - Update: PATCH /api/admin/coupons/:id
 */
window.saveCoupon = function(e) {
  e.preventDefault();
  
  const form = document.getElementById('coupon-form');
  if (!form) {
    console.error('Coupon form not found');
    showNotification('Error: Form not found', 'error');
    return;
  }
  
  const couponId = form.dataset.couponId;
  
  // Get form values
  const codeInput = document.getElementById('coupon-code');
  const typeSelect = document.getElementById('coupon-type');
  const valueInput = document.getElementById('coupon-value');
  const minPurchaseInput = document.getElementById('coupon-min-purchase');
  const maxDiscountInput = document.getElementById('coupon-max-discount');
  const usageLimitInput = document.getElementById('coupon-usage-limit');
  const expiresInput = document.getElementById('coupon-expires-at');
  const isActiveCheckbox = document.getElementById('coupon-is-active');
  
  if (!codeInput || !typeSelect || !valueInput || !usageLimitInput || !expiresInput) {
    showNotification('Error: Form fields not found', 'error');
    return;
  }
  
  const couponData = {
    code: codeInput.value.trim().toUpperCase(),
    type: typeSelect.value,
    value: parseFloat(valueInput.value),
    minPurchase: parseFloat(minPurchaseInput.value) || 0,
    maxDiscount: parseFloat(maxDiscountInput.value) || 0,
    usageLimit: parseInt(usageLimitInput.value) || 100,
    expiresAt: new Date(expiresInput.value + 'T23:59:59Z').toISOString(),
    isActive: isActiveCheckbox ? isActiveCheckbox.checked : true
  };

  // Validation
  if (!couponData.code || couponData.code.length < 3) {
    showNotification('Coupon code must be at least 3 characters', 'error');
    codeInput.focus();
    return;
  }

  // Check for duplicate code (if creating new)
  if (!couponId) {
    const existing = currentCoupons.find(c => c.code === couponData.code);
    if (existing) {
      showNotification(`Coupon code "${couponData.code}" already exists`, 'error');
      codeInput.focus();
      return;
    }
  } else {
    // Check for duplicate code (if editing, exclude current coupon)
    const existing = currentCoupons.find(c => c.code === couponData.code && c.id !== couponId);
    if (existing) {
      showNotification(`Coupon code "${couponData.code}" already exists`, 'error');
      codeInput.focus();
      return;
    }
  }

  if (!couponData.value || couponData.value <= 0) {
    showNotification('Coupon value must be greater than 0', 'error');
    valueInput.focus();
    return;
  }

  if (couponData.type === 'percentage' && couponData.value > 100) {
    showNotification('Percentage discount cannot exceed 100%', 'error');
    valueInput.focus();
    return;
  }

  if (!couponData.expiresAt || isNaN(new Date(couponData.expiresAt).getTime())) {
    showNotification('Please select a valid expiration date', 'error');
    expiresInput.focus();
    return;
  }

  if (new Date(couponData.expiresAt) < new Date()) {
    showNotification('Expiration date must be in the future', 'error');
    expiresInput.focus();
    return;
  }

  if (couponData.usageLimit < 1) {
    showNotification('Usage limit must be at least 1', 'error');
    usageLimitInput.focus();
    return;
  }

  if (couponId) {
    // Update existing coupon
    const index = currentCoupons.findIndex(c => c.id === couponId);
    if (index > -1) {
      currentCoupons[index] = {
        ...currentCoupons[index],
        ...couponData,
        usageCount: currentCoupons[index].usageCount, // Preserve usage count
        updatedAt: new Date().toISOString()
      };
      saveCoupons(); // Save to localStorage
      renderCoupons();
      showNotification(`Coupon "${couponData.code}" updated successfully`, 'success');
      closeCouponForm();
    } else {
      showNotification('Coupon not found', 'error');
    }
  } else {
    // Create new coupon
    const newCoupon = {
      id: `CPN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...couponData,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    currentCoupons.push(newCoupon);
    saveCoupons(); // Save to localStorage
    renderCoupons();
    showNotification(`Coupon "${couponData.code}" created successfully`, 'success');
    closeCouponForm();
  }
};

/**
 * Close coupon form modal
 */
window.closeCouponForm = function() {
  const modal = document.getElementById('coupon-form-modal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
  }
};

/**
 * Toggle coupon type fields
 */
function toggleCouponTypeFields() {
  const typeSelect = document.getElementById('coupon-type');
  const maxDiscountGroup = document.getElementById('coupon-max-discount-group');
  
  if (!typeSelect || !maxDiscountGroup) return;
  
  if (typeSelect.value === 'percentage') {
    maxDiscountGroup.style.display = 'block';
  } else {
    maxDiscountGroup.style.display = 'none';
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe';
  const textColor = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';
  
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${bgColor};
    color: ${textColor};
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2000;
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 400px;
    font-weight: 500;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Initialize coupons page
 */
export function initCoupons() {
  // Coupon type change handler
  const typeSelect = document.getElementById('coupon-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', toggleCouponTypeFields);
  }

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('coupon-form-modal');
      if (modal && modal.classList.contains('show')) {
        closeCouponForm();
      }
    }
  });

  // Close modal when clicking backdrop
  const modal = document.getElementById('coupon-form-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCouponForm();
      }
    });
  }

  // Initial render
  renderCoupons();
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoupons);
} else {
  initCoupons();
}
