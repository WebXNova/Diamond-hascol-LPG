/**
 * Coupons Management Module
 * Handles coupons list, create, edit, delete operations
 * Connected to backend API
 */

let currentCoupons = [];
let isLoading = false;

/**
 * Fetch coupons from backend API
 */
async function fetchCoupons() {
  try {
    isLoading = true;
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminCoupons') : 'http://localhost:5000/api/admin/coupons';
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch coupons: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      // Transform backend data to match frontend format
      currentCoupons = data.data.map(coupon => ({
        id: coupon.code, // Use code as ID for consistency
        code: coupon.code,
        type: coupon.discountType === 'percentage' ? 'percentage' : 'fixed',
        value: parseFloat(coupon.discountValue),
        minPurchase: parseFloat(coupon.minOrderAmount || 0),
        maxDiscount: coupon.discountType === 'percentage' ? parseFloat(coupon.discountValue) * 100 : parseFloat(coupon.discountValue), // Approximate
        usageLimit: 999, // Backend doesn't track this, use high default
        usageCount: 0, // Backend doesn't track this yet
        expiresAt: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default 1 year if no expiry
        isActive: coupon.isActive,
        createdAt: coupon.createdAt || new Date().toISOString()
      }));
      return currentCoupons;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error fetching coupons:', error);
    showNotification('Failed to load coupons. Please refresh the page.', 'error');
    return [];
  } finally {
    isLoading = false;
  }
}

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
  const coupon = currentCoupons.find(c => c.id === couponId || c.code === couponId);
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
  form.dataset.couponId = coupon.code; // Use code as ID for API calls
  
  // Populate form
  const codeInput = document.getElementById('coupon-code');
  const typeSelect = document.getElementById('coupon-type');
  const valueInput = document.getElementById('coupon-value');
  const minPurchaseInput = document.getElementById('coupon-min-purchase');
  const expiresInput = document.getElementById('coupon-expires-at');
  const isActiveCheckbox = document.getElementById('coupon-is-active');
  const cylinderTypeSelect = document.getElementById('coupon-cylinder-type');
  
  if (codeInput) {
    codeInput.value = coupon.code;
    codeInput.disabled = true; // Disable code editing
  }
  if (typeSelect) typeSelect.value = coupon.type === 'percentage' ? 'percentage' : 'flat';
  if (valueInput) valueInput.value = coupon.value;
  if (minPurchaseInput) minPurchaseInput.value = coupon.minPurchase || 0;
  if (expiresInput) {
    const date = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
    if (date && !isNaN(date.getTime())) {
      expiresInput.value = date.toISOString().split('T')[0];
    }
    expiresInput.min = new Date().toISOString().split('T')[0];
  }
  if (isActiveCheckbox) isActiveCheckbox.checked = coupon.isActive;
  if (cylinderTypeSelect) {
    // Map to backend format - assume 'Both' if not specified
    cylinderTypeSelect.value = 'Both'; // Default, can be enhanced if backend provides this field
  }
  
  // Show/hide max discount field
  toggleCouponTypeFields();
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
};

/**
 * Delete coupon via API
 */
window.deleteCoupon = async function(couponId) {
  const coupon = currentCoupons.find(c => c.id === couponId);
  if (!coupon) {
    showNotification('Coupon not found', 'error');
    return;
  }

  if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminCoupons') : 'http://localhost:5000/api/admin/coupons';
    const response = await fetch(`${apiUrl}/${coupon.code}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete coupon: ${response.statusText}`);
    }

    // Refresh coupons from backend
    await fetchCoupons();
    renderCoupons();
    showNotification(`Coupon "${coupon.code}" deleted successfully`, 'success');
  } catch (error) {
    console.error('Error deleting coupon:', error);
    showNotification(error.message || 'Failed to delete coupon. Please try again.', 'error');
  }
};

/**
 * Save coupon (create or update) via API
 */
window.saveCoupon = async function(e) {
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
  const expiresInput = document.getElementById('coupon-expires-at');
  const isActiveCheckbox = document.getElementById('coupon-is-active');
  const cylinderTypeSelect = document.getElementById('coupon-cylinder-type');
  
  if (!codeInput || !typeSelect || !valueInput || !expiresInput) {
    showNotification('Error: Form fields not found', 'error');
    return;
  }
  
  const couponData = {
    code: codeInput.value.trim().toUpperCase(),
    discountType: typeSelect.value, // 'percentage' or 'flat'
    discountValue: parseFloat(valueInput.value),
    minOrderAmount: parseFloat(minPurchaseInput?.value || 0) || undefined,
    applicableCylinderType: cylinderTypeSelect?.value || 'Both', // 'Domestic', 'Commercial', or 'Both'
    expiryDate: expiresInput.value || undefined, // YYYY-MM-DD format
    isActive: isActiveCheckbox ? isActiveCheckbox.checked : true
  };

  // Validation
  if (!couponData.code || couponData.code.length < 3) {
    showNotification('Coupon code must be at least 3 characters', 'error');
    codeInput.focus();
    return;
  }

  if (!couponData.discountValue || couponData.discountValue <= 0) {
    showNotification('Coupon value must be greater than 0', 'error');
    valueInput.focus();
    return;
  }

  if (couponData.discountType === 'percentage' && couponData.discountValue > 100) {
    showNotification('Percentage discount cannot exceed 100%', 'error');
    valueInput.focus();
    return;
  }

  if (couponData.expiryDate && new Date(couponData.expiryDate) < new Date()) {
    showNotification('Expiration date must be in the future', 'error');
    expiresInput.focus();
    return;
  }

  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminCoupons') : 'http://localhost:5000/api/admin/coupons';
    
    if (couponId) {
      // Update existing coupon
      const response = await fetch(`${apiUrl}/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update coupon: ${response.statusText}`);
      }

      showNotification(`Coupon "${couponData.code}" updated successfully`, 'success');
    } else {
      // Create new coupon
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create coupon: ${response.statusText}`);
      }

      showNotification(`Coupon "${couponData.code}" created successfully`, 'success');
    }

    // Refresh coupons from backend
    await fetchCoupons();
    renderCoupons();
    closeCouponForm();
  } catch (error) {
    console.error('Error saving coupon:', error);
    showNotification(error.message || 'Failed to save coupon. Please try again.', 'error');
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
export async function initCoupons() {
  // Show loading state
  const tableBody = document.getElementById('coupons-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          Loading coupons...
        </td>
      </tr>
    `;
  }

  // Fetch coupons from backend
  await fetchCoupons();
  renderCoupons();

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

  // Refresh button (if exists)
  const refreshBtn = document.getElementById('coupons-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await fetchCoupons();
      renderCoupons();
      showNotification('Coupons refreshed', 'success');
    });
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoupons);
} else {
  initCoupons();
}
