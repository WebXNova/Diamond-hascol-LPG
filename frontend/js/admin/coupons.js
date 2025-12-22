/**
 * Coupons Management Module
 * Handles coupons list, create, edit, delete operations
 * Connected to backend API with strict authentication
 */

let currentCoupons = [];
let isLoading = false;

/**
 * Get auth token safely
 */
function getAuthToken() {
  try {
    if (window.getAuthToken && typeof window.getAuthToken === 'function') {
      return window.getAuthToken();
    }
    // Fallback: get from localStorage directly
    const sessionData = localStorage.getItem('admin_auth_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.token || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
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
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Format coupon value
 */
function formatCouponValue(coupon) {
  if (coupon.type === 'percentage') {
    return `${coupon.value}%`;
  } else {
    return `₨${coupon.value.toLocaleString('en-PK')}`;
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
    color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Fetch coupons from backend API
 */
async function fetchCoupons() {
  try {
    isLoading = true;
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminCoupons') : 'http://localhost:5000/api/admin/coupons';
    
    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('admin_auth_session');
      window.location.replace('/admin/login.html');
      throw new Error('Session expired. Please login again.');
    }

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
        createdAt: coupon.createdAt || new Date().toISOString(),
        applicableCylinderType: coupon.applicableCylinderType || 'Both'
      }));
      return currentCoupons;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error fetching coupons:', error);
    
    // Don't show error if redirecting to login
    if (!error.message.includes('Session expired') && !error.message.includes('Authentication required')) {
      showNotification('Failed to load coupons. Please refresh the page.', 'error');
    }
    return [];
  } finally {
    isLoading = false;
  }
}

/**
 * Render coupons table
 */
function renderCoupons() {
  const tableBody = document.getElementById('coupons-table-body');
  if (!tableBody) {
    console.error('Table body element not found: coupons-table-body');
    return;
  }

  if (currentCoupons.length === 0) {
    tableBody.innerHTML = `
      <tr>
<<<<<<< HEAD
        <td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-500);">
          No coupons found. Create your first coupon!
=======
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          No coupons found. Create your first coupon to get started.
>>>>>>> 7f425a9 (backend completed)
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = currentCoupons.map(coupon => {
    const usagePercent = coupon.usageLimit > 0 ? (coupon.usageCount / coupon.usageLimit) * 100 : 0;
    const expired = isExpired(coupon.expiresAt);
<<<<<<< HEAD
    const usagePercent = (coupon.usageCount / coupon.usageLimit) * 100;

    const typeLabel = coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount';
    const minPurchaseLabel = coupon.minPurchase > 0 ? `₨${coupon.minPurchase.toLocaleString()}` : 'None';
    const maxDiscountLabel = coupon.maxDiscount > 0 ? `₨${coupon.maxDiscount.toLocaleString()}` : 'Unlimited';
    const statusLabel = expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive';
    const statusClass = expired ? 'admin-badge--cancelled' : coupon.isActive ? 'admin-badge--delivered' : 'admin-badge--pending';
    const expiresLabel = formatDate(coupon.expiresAt);

    const usageMarkup = `
      <div style="font-size: var(--fs-0);">
        <div>${coupon.usageCount} / ${coupon.usageLimit}</div>
        <div style="width: 100px; height: 4px; background: var(--bg-2); border-radius: 2px; margin-top: 0.25rem; overflow: hidden;">
          <div style="width: ${Math.min(usagePercent, 100)}%; height: 100%; background: var(--color-brand); transition: width 0.3s;"></div>
        </div>
      </div>
    `;

    const actionsMarkup = `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="admin-btn admin-btn--secondary" onclick="editCoupon('${coupon.id}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
          Edit
        </button>
        <button class="admin-btn admin-btn--danger" onclick="deleteCoupon('${coupon.id}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
          Delete
        </button>
      </div>
    `;

=======
    
>>>>>>> 7f425a9 (backend completed)
    return `
      <tr class="admin-table__main-row" data-coupon-id="${coupon.id}">
        <td><strong>${coupon.code}</strong></td>
        <td>${formatCouponValue(coupon)}</td>
<<<<<<< HEAD
        <td>${typeLabel}</td>
        <td>${minPurchaseLabel}</td>
        <td>${maxDiscountLabel}</td>
        <td>
          <span class="admin-badge ${statusClass}">
            ${statusLabel}
=======
        <td>${coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}</td>
        <td>${coupon.minPurchase > 0 ? `₨${coupon.minPurchase.toLocaleString('en-PK')}` : 'None'}</td>
        <td>${coupon.maxDiscount > 0 ? `₨${coupon.maxDiscount.toLocaleString('en-PK')}` : 'N/A'}</td>
        <td>
          <span class="admin-badge ${coupon.isActive && !expired ? 'admin-badge--confirmed' : 'admin-badge--cancelled'}">
            ${coupon.isActive && !expired ? 'Active' : expired ? 'Expired' : 'Inactive'}
>>>>>>> 7f425a9 (backend completed)
          </span>
        </td>
        <td>${usageMarkup}</td>
        <td>${expiresLabel}</td>
        <td>${actionsMarkup}</td>
        <td class="admin-table__more-col">
          <button type="button" class="admin-table__more-btn" data-coupon-id="${coupon.id}" aria-expanded="false">
            More
          </button>
        </td>
<<<<<<< HEAD
      </tr>
      <tr class="admin-table__details-row" data-coupon-id="${coupon.id}" aria-hidden="true">
        <td colspan="10">
          <div class="admin-table__details">
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Type</span>
              <span class="admin-table__details-value">${typeLabel}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Min Purchase</span>
              <span class="admin-table__details-value">${minPurchaseLabel}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Max Discount</span>
              <span class="admin-table__details-value">${maxDiscountLabel}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Usage</span>
              <span class="admin-table__details-value">${coupon.usageCount} / ${coupon.usageLimit}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Expires</span>
              <span class="admin-table__details-value">${expiresLabel}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Actions</span>
              <span class="admin-table__details-value">${actionsMarkup}</span>
            </div>
=======
        <td>${formatDate(coupon.expiresAt)}</td>
        <td>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="admin-btn admin-btn--secondary" onclick="editCoupon('${coupon.code}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
              Edit
            </button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCoupon('${coupon.code}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
              Delete
            </button>
>>>>>>> 7f425a9 (backend completed)
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Toggle "More" details (shown on <=1024px via CSS)
  tableBody.querySelectorAll('.admin-table__more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-coupon-id');
      const detailsRow = tableBody.querySelector(`.admin-table__details-row[data-coupon-id="${id}"]`);
      if (!detailsRow) return;

      const isOpen = detailsRow.classList.toggle('is-open');
      detailsRow.setAttribute('aria-hidden', String(!isOpen));
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen ? 'Less' : 'More';
    });
  });
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
  const cylinderTypeSelect = document.getElementById('coupon-cylinder-type');
  
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
  if (cylinderTypeSelect) cylinderTypeSelect.value = 'Both';
  
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
    showNotification('Error: Form elements not found', 'error');
    return;
  }

  modalTitle.textContent = `Edit Coupon: ${coupon.code}`;
  form.dataset.couponId = coupon.code;
  
  // Populate form fields
  const codeInput = document.getElementById('coupon-code');
  const typeSelect = document.getElementById('coupon-type');
  const valueInput = document.getElementById('coupon-value');
  const minPurchaseInput = document.getElementById('coupon-min-purchase');
  const maxDiscountInput = document.getElementById('coupon-max-discount');
  const usageLimitInput = document.getElementById('coupon-usage-limit');
  const expiresInput = document.getElementById('coupon-expires-at');
  const isActiveCheckbox = document.getElementById('coupon-is-active');
  const cylinderTypeSelect = document.getElementById('coupon-cylinder-type');
  
  if (codeInput) {
    codeInput.value = coupon.code;
    codeInput.disabled = true; // Can't change code when editing
  }
  if (typeSelect) typeSelect.value = coupon.type;
  if (valueInput) valueInput.value = coupon.value;
  if (minPurchaseInput) minPurchaseInput.value = coupon.minPurchase || '0';
  if (maxDiscountInput) maxDiscountInput.value = coupon.maxDiscount || '';
  if (usageLimitInput) usageLimitInput.value = coupon.usageLimit || '100';
  if (expiresInput) {
    const expiryDate = coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '';
    expiresInput.value = expiryDate;
    expiresInput.min = new Date().toISOString().split('T')[0];
  }
  if (isActiveCheckbox) isActiveCheckbox.checked = coupon.isActive !== false;
  if (cylinderTypeSelect) {
    cylinderTypeSelect.value = coupon.applicableCylinderType || 'Both';
  }
  
  // Show max discount field for percentage type
  toggleCouponTypeFields();
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
};

/**
 * Delete coupon
 */
window.deleteCoupon = async function(couponId) {
  const coupon = currentCoupons.find(c => c.id === couponId || c.code === couponId);
  if (!coupon) {
    showNotification('Coupon not found', 'error');
    return;
  }

  if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminCoupons') : 'http://localhost:5000/api/admin/coupons';
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${apiUrl}/${coupon.code}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Handle 401
    if (response.status === 401) {
      localStorage.removeItem('admin_auth_session');
      window.location.replace('/admin/login.html');
      throw new Error('Session expired');
    }

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
  const maxDiscountInput = document.getElementById('coupon-max-discount');
  const usageLimitInput = document.getElementById('coupon-usage-limit');
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
    applicableCylinderType: cylinderTypeSelect ? cylinderTypeSelect.value : 'Both', // 'Domestic', 'Commercial', or 'Both'
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
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    if (couponId) {
      // Update existing coupon
      const response = await fetch(`${apiUrl}/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });

      // Handle 401
      if (response.status === 401) {
        localStorage.removeItem('admin_auth_session');
        window.location.replace('/admin/login.html');
        throw new Error('Session expired');
      }

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
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });

      // Handle 401
      if (response.status === 401) {
        localStorage.removeItem('admin_auth_session');
        window.location.replace('/admin/login.html');
        throw new Error('Session expired');
      }

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
  const form = document.getElementById('coupon-form');
  const codeInput = document.getElementById('coupon-code');
  
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  if (form) {
    form.reset();
    form.dataset.couponId = '';
  }
  
  if (codeInput) {
    codeInput.disabled = false; // Re-enable code input
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

  // Setup coupon type toggle
  const typeSelect = document.getElementById('coupon-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', toggleCouponTypeFields);
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoupons);
} else {
  initCoupons();
}
