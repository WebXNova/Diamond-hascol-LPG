/**
 * Coupons Management Module
 * Handles coupons list, create, edit, delete operations
 */

import { mockCoupons } from '../../data/mock-data.js';

let currentCoupons = [...mockCoupons];

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

  if (currentCoupons.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-500);">
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
              <div style="width: ${usagePercent}%; height: 100%; background: var(--color-brand); transition: width 0.3s;"></div>
            </div>
          </div>
        </td>
        <td>${formatDate(coupon.expiresAt)}</td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
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
  
  modalTitle.textContent = 'Create New Coupon';
  form.reset();
  form.dataset.couponId = '';
  
  // Set default values
  document.getElementById('coupon-code').value = '';
  document.getElementById('coupon-type').value = 'percentage';
  document.getElementById('coupon-value').value = '';
  document.getElementById('coupon-min-purchase').value = '0';
  document.getElementById('coupon-max-discount').value = '';
  document.getElementById('coupon-usage-limit').value = '100';
  document.getElementById('coupon-expires-at').value = '';
  document.getElementById('coupon-is-active').checked = true;
  
  modal.classList.add('show');
};

/**
 * Edit coupon
 */
window.editCoupon = function(couponId) {
  const coupon = currentCoupons.find(c => c.id === couponId);
  if (!coupon) return;

  const modal = document.getElementById('coupon-form-modal');
  const form = document.getElementById('coupon-form');
  const modalTitle = document.getElementById('coupon-form-title');
  
  modalTitle.textContent = 'Edit Coupon';
  form.dataset.couponId = couponId;
  
  // Populate form
  document.getElementById('coupon-code').value = coupon.code;
  document.getElementById('coupon-type').value = coupon.type;
  document.getElementById('coupon-value').value = coupon.value;
  document.getElementById('coupon-min-purchase').value = coupon.minPurchase;
  document.getElementById('coupon-max-discount').value = coupon.maxDiscount;
  document.getElementById('coupon-usage-limit').value = coupon.usageLimit;
  document.getElementById('coupon-expires-at').value = coupon.expiresAt.split('T')[0];
  document.getElementById('coupon-is-active').checked = coupon.isActive;
  
  modal.classList.add('show');
};

/**
 * Delete coupon
 */
window.deleteCoupon = function(couponId) {
  const coupon = currentCoupons.find(c => c.id === couponId);
  if (!coupon) return;

  if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
    return;
  }

  // In production: DELETE /api/admin/coupons/:id
  const index = currentCoupons.findIndex(c => c.id === couponId);
  if (index > -1) {
    currentCoupons.splice(index, 1);
    renderCoupons();
    showNotification(`Coupon "${coupon.code}" deleted successfully`, 'success');
  }
};

/**
 * Save coupon (create or update)
 */
window.saveCoupon = function(e) {
  e.preventDefault();
  
  const form = document.getElementById('coupon-form');
  const couponId = form.dataset.couponId;
  
  const couponData = {
    code: document.getElementById('coupon-code').value.trim().toUpperCase(),
    type: document.getElementById('coupon-type').value,
    value: parseFloat(document.getElementById('coupon-value').value),
    minPurchase: parseFloat(document.getElementById('coupon-min-purchase').value) || 0,
    maxDiscount: parseFloat(document.getElementById('coupon-max-discount').value) || 0,
    usageLimit: parseInt(document.getElementById('coupon-usage-limit').value) || 100,
    expiresAt: new Date(document.getElementById('coupon-expires-at').value + 'T23:59:59Z').toISOString(),
    isActive: document.getElementById('coupon-is-active').checked
  };

  // Validation
  if (!couponData.code) {
    alert('Coupon code is required');
    return;
  }

  if (!couponData.value || couponData.value <= 0) {
    alert('Coupon value must be greater than 0');
    return;
  }

  if (!couponData.expiresAt || isNaN(new Date(couponData.expiresAt).getTime())) {
    alert('Please select a valid expiration date');
    return;
  }

  if (couponId) {
    // Update existing coupon
    // In production: PATCH /api/admin/coupons/:id
    const index = currentCoupons.findIndex(c => c.id === couponId);
    if (index > -1) {
      currentCoupons[index] = {
        ...currentCoupons[index],
        ...couponData,
        usageCount: currentCoupons[index].usageCount // Preserve usage count
      };
      showNotification(`Coupon "${couponData.code}" updated successfully`, 'success');
    }
  } else {
    // Create new coupon
    // In production: POST /api/admin/coupons
    const newCoupon = {
      id: `CPN-${Date.now()}`,
      ...couponData,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    currentCoupons.push(newCoupon);
    showNotification(`Coupon "${couponData.code}" created successfully`, 'success');
  }

  renderCoupons();
  closeCouponForm();
};

/**
 * Close coupon form modal
 */
window.closeCouponForm = function() {
  const modal = document.getElementById('coupon-form-modal');
  modal.classList.remove('show');
};

/**
 * Toggle coupon type fields
 */
function toggleCouponTypeFields() {
  const type = document.getElementById('coupon-type').value;
  const maxDiscountGroup = document.getElementById('coupon-max-discount-group');
  
  if (type === 'percentage') {
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
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#d1fae5' : '#dbeafe'};
    color: ${type === 'success' ? '#065f46' : '#1e40af'};
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideIn 0.3s var(--ease-out);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s var(--ease-out)';
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

  // Initial render
  renderCoupons();
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoupons);
} else {
  initCoupons();
}

