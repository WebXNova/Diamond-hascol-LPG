/**
 * Orders Management Module
 * Handles orders list, filtering, searching, and status updates
 * Connected to backend API
 */

let currentOrders = [];
let currentFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: ''
};

/**
 * Format currency
 */
function formatCurrency(amount) {
  return `₨${amount.toLocaleString()}`;
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
  const statusMap = {
    'pending': 'admin-badge--pending',
    'confirmed': 'admin-badge--confirmed',
    'delivered': 'admin-badge--delivered',
    'cancelled': 'admin-badge--cancelled'
  };
  return statusMap[status] || 'admin-badge--pending';
}

/**
 * Fetch orders from backend API
 */
async function fetchOrders() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminOrders') : 'http://localhost:5000/api/admin/orders';
    console.log('🔄 Fetching orders from:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }
    
    let data;
    try {
      data = await response.json();
      console.log('✅ Received data:', data);
    } catch (jsonError) {
      console.error('❌ JSON parse error:', jsonError);
      throw new Error('Invalid JSON response from server');
    }
    
    if (data.success && Array.isArray(data.data)) {
      currentOrders = data.data;
      console.log(`✅ Loaded ${currentOrders.length} orders into memory`);
      return currentOrders;
    } else {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    showNotification(`Failed to load orders: ${error.message}`, 'error');
    // Show error in table too
    const tableBody = document.getElementById('orders-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-danger);">
            Error loading orders: ${error.message}<br/>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-brand); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
              Retry
            </button>
          </td>
        </tr>
      `;
    }
    return [];
  }
}

/**
 * Filter orders based on current filters (client-side filtering)
 */
function filterOrders() {
  let filtered = [...currentOrders];

  // Status filter
  if (currentFilters.status !== 'all') {
    filtered = filtered.filter(order => order.status === currentFilters.status);
  }

  // Search filter
  if (currentFilters.search) {
    const searchLower = currentFilters.search.toLowerCase();
    filtered = filtered.filter(order => {
      const id = String(order.id || '').toLowerCase();
      const customerName = String(order.customerName || '').toLowerCase();
      const phone = String(order.phone || '').toLowerCase();
      const address = String(order.address || '').toLowerCase();
      return id.includes(searchLower) ||
        customerName.includes(searchLower) ||
        phone.includes(searchLower) ||
        address.includes(searchLower);
    });
  }

  // Date filters
  if (currentFilters.dateFrom) {
    const fromDate = new Date(currentFilters.dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate >= fromDate;
    });
  }

  if (currentFilters.dateTo) {
    const toDate = new Date(currentFilters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
  }

  return filtered;
}

/**
 * Render orders table
 */
function renderOrders() {
  console.log('🎨 Rendering orders...');
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) {
    console.error('❌ Table body element not found: orders-table-body');
    return;
  }
  
  const filtered = filterOrders();
  console.log(`📊 Filtered ${filtered.length} orders (from ${currentOrders.length} total)`);

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-500);">
          ${currentOrders.length === 0 ? 'No orders found. Orders will appear here when customers place orders.' : 'No orders found matching your filters.'}
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(order => {
    const orderId = order.id || 'N/A';
    const customerName = order.customerName || 'N/A';
    const phone = order.phone || 'N/A';
    const cylinderType = order.cylinderType ? order.cylinderType.charAt(0).toUpperCase() + order.cylinderType.slice(1) : 'N/A';
    const quantity = order.quantity || 0;
    const total = order.total || 0;
    const status = order.status || 'pending';
    const createdAt = order.createdAt ? formatDate(order.createdAt) : 'N/A';
    
    return `
    <tr>
      <td class="admin-table__col-main"><strong>#${orderId}</strong></td>
      <td class="admin-table__col-main">${customerName}</td>
      <td class="admin-table__col-extra">${phone}</td>
      <td class="admin-table__col-extra">${cylinderType}</td>
      <td class="admin-table__col-extra">${quantity}</td>
      <td class="admin-table__col-main"><strong>${formatCurrency(total)}</strong></td>
      <td class="admin-table__col-main">
        <select class="admin-order-status-select" data-order-id="${orderId}" data-current-status="${status}">
          <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="delivered" ${status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td class="admin-table__col-extra">${createdAt}</td>
      <td class="admin-table__col-actions">
        <button class="admin-btn admin-btn--secondary admin-order-more-btn" onclick="viewOrderDetails('${orderId}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
          More
        </button>
        <button class="admin-btn admin-btn--danger admin-order-delete-btn" onclick="deleteOrder('${orderId}')" style="padding: 0.5rem 1rem; font-size: var(--fs-0);">
          Delete
        </button>
      </td>
    </tr>
  `;
  }).join('');

  // Attach status change handlers
  document.querySelectorAll('.admin-order-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      updateOrderStatus(orderId, newStatus);
    });
  });
  
  console.log('✅ Orders rendered successfully');
}

/**
 * Update order status via API
 */
async function updateOrderStatus(orderId, newStatus) {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminOrders') : 'http://localhost:5000/api/admin/orders';
    const response = await fetch(`${apiUrl}/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    // Refresh orders from backend
    await fetchOrders();
    renderOrders();
    showNotification(`Order #${orderId} status updated to ${newStatus}`, 'success');
  } catch (error) {
    console.error('Error updating order status:', error);
    showNotification(`Failed to update order status: ${error.message}`, 'error');
    
    // Revert the select to previous value
    const select = document.querySelector(`[data-order-id="${orderId}"]`);
    if (select) {
      select.value = select.dataset.currentStatus;
    }
  }
}

/**
 * View order details
 */
window.viewOrderDetails = async function(orderId) {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminOrders') : 'http://localhost:5000/api/admin/orders';
    const response = await fetch(`${apiUrl}/${orderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Invalid JSON response from server');
    }
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }
    
    const order = data.data;

    const modal = document.getElementById('order-details-modal');
    const modalContent = document.getElementById('order-details-content');
    
    if (!modal || !modalContent) {
      console.error('Modal elements not found');
      return;
    }
    
    modalContent.innerHTML = `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Order Information</h3>
          <div style="display: grid; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Order ID:</span>
              <strong>#${order.id || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Status:</span>
              <span class="admin-badge ${getStatusBadgeClass(order.status || 'pending')}">${order.status || 'pending'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Date:</span>
              <span>${order.createdAt ? formatDate(order.createdAt) : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Customer Information</h3>
          <div style="display: grid; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Name:</span>
              <strong>${order.customerName || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-500);">Phone:</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${order.phone || 'N/A'}</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Address:</span>
              <span style="text-align: right; max-width: 60%;">${order.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Order Details</h3>
          <div style="display: grid; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Cylinder Type:</span>
              <strong>${order.cylinderType ? order.cylinderType.charAt(0).toUpperCase() + order.cylinderType.slice(1) : 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Quantity:</span>
              <strong>${order.quantity || 0}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Price per Cylinder:</span>
              <strong>${formatCurrency(order.pricePerCylinder || 0)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Subtotal:</span>
              <strong>${formatCurrency(order.subtotal || 0)}</strong>
            </div>
            ${(order.discount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Discount:</span>
              <strong style="color: var(--color-success);">-${formatCurrency(order.discount || 0)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Coupon:</span>
              <span>${order.couponCode || 'None'}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid var(--border);">
              <span style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900);">Total:</span>
              <strong style="font-size: var(--fs-3); color: var(--color-brand);">${formatCurrency(order.total || order.totalPrice || 0)}</strong>
            </div>
          </div>
        </div>

        ${order.phone ? `
        <div style="padding-top: 0.25rem;">
          <a href="tel:${order.phone}" class="admin-btn admin-btn--danger" style="width: 100%; justify-content: center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Call Customer
          </a>
        </div>
        ` : ''}
      </div>
    `;

    modal.classList.add('show');
  } catch (error) {
    console.error('Error fetching order details:', error);
    showNotification('Failed to load order details', 'error');
  }
};

/**
 * Close order details modal
 */
window.closeOrderDetails = function() {
  const modal = document.getElementById('order-details-modal');
  modal.classList.remove('show');
};

/**
 * Delete order via API
 */
window.deleteOrder = async function(orderId) {
  if (!confirm(`Are you sure you want to delete order #${orderId}? This action cannot be undone.`)) {
    return;
  }

  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminOrders') : 'http://localhost:5000/api/admin/orders';
    const response = await fetch(`${apiUrl}/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    // Refresh orders from backend
    await fetchOrders();
    renderOrders();
    showNotification(`Order #${orderId} deleted successfully`, 'success');
  } catch (error) {
    console.error('Error deleting order:', error);
    showNotification(`Failed to delete order: ${error.message}`, 'error');
  }
};

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
 * Initialize orders page
 */
export async function initOrders() {
  console.log('🚀 Initializing orders page...');
  
  // Show loading state
  const tableBody = document.getElementById('orders-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-500);">
          Loading orders...
        </td>
      </tr>
    `;
  } else {
    console.error('❌ Table body not found during initialization');
  }

  // Fetch orders from backend
  try {
    await fetchOrders();
    renderOrders();
    console.log('✅ Orders page initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize orders page:', error);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-danger);">
            Failed to initialize: ${error.message}
          </td>
        </tr>
      `;
    }
  }

  // Search input
  const searchInput = document.getElementById('orders-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value;
      renderOrders();
    });
  }

  // Status filter
  const statusFilter = document.getElementById('orders-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderOrders();
    });
  }

  // Date filters
  const dateFromInput = document.getElementById('orders-date-from');
  if (dateFromInput) {
    dateFromInput.addEventListener('change', (e) => {
      currentFilters.dateFrom = e.target.value;
      renderOrders();
    });
  }

  const dateToInput = document.getElementById('orders-date-to');
  if (dateToInput) {
    dateToInput.addEventListener('change', (e) => {
      currentFilters.dateTo = e.target.value;
      renderOrders();
    });
  }

  // Clear filters
  const clearFiltersBtn = document.getElementById('orders-clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', async () => {
      currentFilters = {
        status: 'all',
        search: '',
        dateFrom: '',
        dateTo: ''
      };
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      await fetchOrders();
      renderOrders();
    });
  }

  // Refresh button (if exists)
  const refreshBtn = document.getElementById('orders-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await fetchOrders();
      renderOrders();
      showNotification('Orders refreshed', 'success');
    });
  }
}

// Auto-initialize with retry mechanism
function initializeWithRetry() {
  console.log('🔧 Attempting to initialize orders page...');
  console.log('Document ready state:', document.readyState);
  
  if (document.readyState === 'loading') {
    console.log('⏳ Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOMContentLoaded fired');
      setTimeout(initOrders, 100); // Small delay to ensure all scripts are loaded
    });
  } else {
    console.log('✅ Document ready, initializing immediately');
    setTimeout(initOrders, 100); // Small delay to ensure all scripts are loaded
  }
}

// Also expose globally for manual refresh
window.refreshOrders = async function() {
  console.log('🔄 Manual refresh triggered');
  await fetchOrders();
  renderOrders();
};

// Expose initOrders globally as well
window.initOrdersPage = initOrders;

initializeWithRetry();

