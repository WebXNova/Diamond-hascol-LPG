/**
 * Order History Management Module
 * Handles order history list, filtering, and analytics
 * Connected to backend API with strict authentication
 */

let currentHistory = [];
let currentFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: ''
};

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
 * Format currency
 */
function formatCurrency(amount) {
  return `₨${amount.toLocaleString('en-PK')}`;
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
 * Fetch order history from backend API (only delivered and cancelled orders)
 */
async function fetchHistory() {
  try {
    // Use the history endpoint that returns only delivered and cancelled orders
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminOrders') + '/history' : 'http://localhost:5000/api/admin/orders/history';
    
    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    
    // Build query params
    const params = new URLSearchParams();
    if (currentFilters.status !== 'all') {
      params.append('status', currentFilters.status);
    }
    params.append('limit', '1000'); // Get all orders for history
    
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
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
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      // Transform backend data to match frontend format
      currentHistory = data.data.map(order => ({
        id: order.id,
        customerName: order.customerName || 'N/A',
        phone: order.phone || 'N/A',
        cylinderType: order.cylinderType?.toLowerCase() || 'domestic',
        quantity: order.quantity || 0,
        total: order.total || order.totalPrice || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || new Date().toISOString(),
        address: order.address || '',
        coupon: order.couponCode || null
      }));
      return currentHistory;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    
    // Don't show error if redirecting to login
    if (!error.message.includes('Session expired') && !error.message.includes('Authentication required')) {
      showNotification('Failed to load order history. Please refresh the page.', 'error');
    }
    return [];
  }
}

/**
 * Filter history based on current filters
 */
function filterHistory() {
  let filtered = [...currentHistory];

  // Status filter
  if (currentFilters.status !== 'all') {
    filtered = filtered.filter(order => order.status === currentFilters.status);
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
 * Calculate stats from filtered history
 */
function calculateStats(filtered) {
  const totalOrders = filtered.length;
  const totalRevenue = filtered.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Status breakdown
  const statusBreakdown = {};
  filtered.forEach(order => {
    const status = order.status || 'pending';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  });

  // Type breakdown
  const typeBreakdown = {};
  filtered.forEach(order => {
    const type = order.cylinderType || 'domestic';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  return {
    totalOrders,
    totalRevenue,
    avgOrder,
    statusBreakdown,
    typeBreakdown
  };
}

/**
 * Render stats cards
 */
function renderStats(filtered) {
  const stats = calculateStats(filtered);

  // Update stat cards
  const totalRevenueEl = document.getElementById('history-total-revenue');
  const totalOrdersEl = document.getElementById('history-total-orders');
  const avgOrderEl = document.getElementById('history-avg-order');

  if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(stats.totalRevenue);
  if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;
  if (avgOrderEl) avgOrderEl.textContent = formatCurrency(stats.avgOrder);

  // Render status breakdown
  const statusBreakdownEl = document.getElementById('status-breakdown');
  if (statusBreakdownEl) {
    const statusLabels = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'in-transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };

    statusBreakdownEl.innerHTML = Object.entries(stats.statusBreakdown)
      .map(([status, count]) => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
          <span style="color: var(--text-700);">${statusLabels[status] || status}</span>
          <strong style="color: var(--text-900);">${count}</strong>
        </div>
      `).join('') || '<div style="padding: 1rem; color: var(--text-500); text-align: center;">No data</div>';
  }

  // Render type breakdown
  const typeBreakdownEl = document.getElementById('type-breakdown');
  if (typeBreakdownEl) {
    const typeLabels = {
      'domestic': 'Domestic',
      'commercial': 'Commercial'
    };

    typeBreakdownEl.innerHTML = Object.entries(stats.typeBreakdown)
      .map(([type, count]) => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
          <span style="color: var(--text-700);">${typeLabels[type] || type}</span>
          <strong style="color: var(--text-900);">${count}</strong>
        </div>
      `).join('') || '<div style="padding: 1rem; color: var(--text-500); text-align: center;">No data</div>';
  }
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
  const statusMap = {
    'pending': 'admin-badge--pending',
    'confirmed': 'admin-badge--confirmed',
    'in-transit': 'admin-badge--in-transit',
    'delivered': 'admin-badge--delivered',
    'cancelled': 'admin-badge--cancelled'
  };
  return statusMap[status] || 'admin-badge--pending';
}

/**
 * Render history table
 */
function renderHistory() {
  const tableBody = document.getElementById('history-table-body');
  if (!tableBody) {
    console.error('Table body element not found: history-table-body');
    return;
  }

  const filtered = filterHistory();

  // Update stats
  renderStats(filtered);

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          ${currentHistory.length === 0 ? 'No order history found. History will appear here when orders are delivered or cancelled.' : 'No orders found matching your filters.'}
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(order => {
<<<<<<< HEAD
    const orderId = order.id || 'N/A';
    const customerName = order.customerName || 'N/A';
    const phone = order.phone || 'N/A';
    const cylinderType = order.cylinderType
      ? order.cylinderType.charAt(0).toUpperCase() + order.cylinderType.slice(1)
      : 'N/A';
    const quantity = order.quantity ?? 'N/A';
    const total = order.total ?? 0;
    const status = order.status || 'pending';
    const createdAt = order.createdAt ? formatDate(order.createdAt) : 'N/A';

    return `
      <tr class="admin-table__main-row" data-history-id="${orderId}">
        <td><strong>${orderId}</strong></td>
        <td>${customerName}</td>
        <td>${phone}</td>
        <td>${cylinderType}</td>
        <td>${quantity}</td>
        <td><strong>${formatCurrency(total)}</strong></td>
        <td><span class="admin-badge ${getStatusBadgeClass(status)}">${status}</span></td>
        <td>${createdAt}</td>
        <td class="admin-table__more-col">
          <button type="button" class="admin-table__more-btn" data-history-id="${orderId}" aria-expanded="false">More</button>
        </td>
      </tr>
      <tr class="admin-table__details-row" data-history-id="${orderId}" aria-hidden="true">
        <td colspan="9">
          <div class="admin-table__details">
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Phone</span>
              <span class="admin-table__details-value">${phone}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Type</span>
              <span class="admin-table__details-value">${cylinderType}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Quantity</span>
              <span class="admin-table__details-value">${quantity}</span>
            </div>
            <div class="admin-table__details-item">
              <span class="admin-table__details-label">Date</span>
              <span class="admin-table__details-value">${createdAt}</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Toggle "More" details (shown on <=1024px via CSS)
  tableBody.querySelectorAll('.admin-table__more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-history-id');
      const detailsRow = tableBody.querySelector(`.admin-table__details-row[data-history-id="${id}"]`);
      if (!detailsRow) return;

      const isOpen = detailsRow.classList.toggle('is-open');
      detailsRow.setAttribute('aria-hidden', String(!isOpen));
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen ? 'Less' : 'More';
    });
  });
=======
    const status = order.status || 'pending';
    const cylinderType = order.cylinderType ? order.cylinderType.charAt(0).toUpperCase() + order.cylinderType.slice(1) : 'N/A';
    
    return `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>${order.customerName}</td>
        <td>${order.phone}</td>
        <td>${cylinderType}</td>
        <td>${order.quantity}</td>
        <td><strong>${formatCurrency(order.total)}</strong></td>
        <td><span class="admin-badge ${getStatusBadgeClass(status)}">${status}</span></td>
        <td>${formatDate(order.createdAt)}</td>
      </tr>
    `;
  }).join('');
>>>>>>> 7f425a9 (backend completed)
}

/**
 * Initialize history page
 */
export async function initHistory() {
  // Show loading state
  const tableBody = document.getElementById('history-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
<<<<<<< HEAD
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          Loading order history...
=======
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-500);">
          Loading history...
>>>>>>> 7f425a9 (backend completed)
        </td>
      </tr>
    `;
  }

  // Fetch history from backend
  try {
    await fetchHistory();
    renderHistory();
  } catch (error) {
    console.error('Failed to initialize history page:', error);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-danger);">
            Failed to load history: ${error.message}
          </td>
        </tr>
      `;
    }
  }

  // Date from filter
  const dateFromInput = document.getElementById('history-date-from');
  if (dateFromInput) {
    dateFromInput.addEventListener('change', (e) => {
      currentFilters.dateFrom = e.target.value;
      renderHistory();
    });
  }

  // Date to filter
  const dateToInput = document.getElementById('history-date-to');
  if (dateToInput) {
    dateToInput.addEventListener('change', (e) => {
      currentFilters.dateTo = e.target.value;
      renderHistory();
    });
  }

  // Status filter
  const statusFilter = document.getElementById('history-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderHistory();
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('history-clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      currentFilters = {
        status: 'all',
        search: '',
        dateFrom: '',
        dateTo: ''
      };
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      renderHistory();
    });
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistory);
} else {
  initHistory();
}
