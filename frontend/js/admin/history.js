/**
 * Order History & Analytics Module
 * Handles order history display, date filtering, and analytics
 * Connected to backend API
 */

let currentHistory = [];
let currentFilters = {
  dateFrom: '',
  dateTo: '',
  status: 'all'
};

/**
 * Fetch order history from backend API (only delivered and cancelled orders)
 */
async function fetchHistory() {
  try {
    // Use the history endpoint that returns only delivered and cancelled orders
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminOrders') + '/history' : 'http://localhost:5000/api/admin/orders/history';
    
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
      },
    });

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
    showNotification('Failed to load order history. Please refresh the page.', 'error');
    return [];
  }
}

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
    'in-transit': 'admin-badge--in-transit',
    'delivered': 'admin-badge--delivered',
    'cancelled': 'admin-badge--cancelled'
  };
  return statusMap[status] || 'admin-badge--pending';
}

/**
 * Filter history (client-side filtering on already fetched data)
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

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return filtered;
}

/**
 * Calculate analytics
 */
function calculateAnalytics() {
  const filtered = filterHistory();
  
  const totalRevenue = filtered.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filtered.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const statusCounts = {
    pending: 0,
    confirmed: 0,
    'in-transit': 0,
    delivered: 0,
    cancelled: 0
  };
  
  filtered.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });

  const typeCounts = {
    domestic: 0,
    commercial: 0
  };
  
  filtered.forEach(order => {
    typeCounts[order.cylinderType] = (typeCounts[order.cylinderType] || 0) + 1;
  });

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    statusCounts,
    typeCounts
  };
}

/**
 * Render analytics
 */
function renderAnalytics() {
  const analytics = calculateAnalytics();
  
  // Update stat cards
  document.getElementById('history-total-revenue').textContent = formatCurrency(analytics.totalRevenue);
  document.getElementById('history-total-orders').textContent = analytics.totalOrders;
  document.getElementById('history-avg-order').textContent = formatCurrency(analytics.avgOrderValue);
  
  // Render status breakdown
  const statusBreakdown = document.getElementById('status-breakdown');
  statusBreakdown.innerHTML = Object.entries(analytics.statusCounts).map(([status, count]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light);">
      <span class="admin-badge ${getStatusBadgeClass(status)}">${status}</span>
      <strong>${count}</strong>
    </div>
  `).join('');
  
  // Render type breakdown
  const typeBreakdown = document.getElementById('type-breakdown');
  typeBreakdown.innerHTML = Object.entries(analytics.typeCounts).map(([type, count]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light);">
      <span style="text-transform: capitalize;">${type}</span>
      <strong>${count}</strong>
    </div>
  `).join('');
}

/**
 * Render history table
 */
function renderHistory() {
  const tableBody = document.getElementById('history-table-body');
  const filtered = filterHistory();

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          No orders found matching your filters.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(order => {
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
}

/**
 * Export orders (mock - placeholder)
 */
window.exportOrders = function() {
  const filtered = filterHistory();
  
  if (filtered.length === 0) {
    alert('No orders to export');
    return;
  }
  
  // In production: GET /api/admin/orders/export?dateFrom=...&dateTo=...
  alert(`Export functionality will be available when backend is integrated.\n\nWould export ${filtered.length} orders.`);
};

/**
 * Initialize history page
 */
export async function initHistory() {
  // Show loading state
  const tableBody = document.getElementById('history-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-500);">
          Loading order history...
        </td>
      </tr>
    `;
  }

  // Fetch orders from backend
  await fetchHistory();

  // Date filters
  const dateFromInput = document.getElementById('history-date-from');
  if (dateFromInput) {
    dateFromInput.addEventListener('change', (e) => {
      currentFilters.dateFrom = e.target.value;
      renderHistory();
      renderAnalytics();
    });
  }

  const dateToInput = document.getElementById('history-date-to');
  if (dateToInput) {
    dateToInput.addEventListener('change', (e) => {
      currentFilters.dateTo = e.target.value;
      renderHistory();
      renderAnalytics();
    });
  }

  // Status filter
  const statusFilter = document.getElementById('history-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderHistory();
      renderAnalytics();
    });
  }

  // Clear filters
  const clearFiltersBtn = document.getElementById('history-clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', async () => {
      currentFilters = {
        dateFrom: '',
        dateTo: '',
        status: 'all'
      };
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      await fetchHistory();
      renderHistory();
      renderAnalytics();
    });
  }

  // Export button
  const exportBtn = document.getElementById('history-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportOrders);
  }

  // Refresh button (if exists)
  const refreshBtn = document.getElementById('history-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await fetchHistory();
      renderHistory();
      renderAnalytics();
      showNotification('Order history refreshed', 'success');
    });
  }

  // Initial render
  renderHistory();
  renderAnalytics();
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
    animation: slideIn 0.3s var(--ease-out);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s var(--ease-out)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistory);
} else {
  initHistory();
}

