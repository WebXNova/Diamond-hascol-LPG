/**
 * Order History & Analytics Module
 * Handles order history display, date filtering, and analytics
 */

import { mockOrders } from '../../data/mock-data.js';

// Use mockOrders for history (in production, this would be a separate API call)
let currentHistory = [...mockOrders];
let currentFilters = {
  dateFrom: '',
  dateTo: '',
  status: 'all'
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
    'in-transit': 'admin-badge--in-transit',
    'delivered': 'admin-badge--delivered',
    'cancelled': 'admin-badge--cancelled'
  };
  return statusMap[status] || 'admin-badge--pending';
}

/**
 * Filter history
 */
function filterHistory() {
  let filtered = [...mockOrders];

  // Status filter
  if (currentFilters.status !== 'all') {
    filtered = filtered.filter(order => order.status === currentFilters.status);
  }

  // Date filters
  if (currentFilters.dateFrom) {
    const fromDate = new Date(currentFilters.dateFrom);
    filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate);
  }

  if (currentFilters.dateTo) {
    const toDate = new Date(currentFilters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  currentHistory = filtered;
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
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-500);">
          No orders found matching your filters.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.customerName}</td>
      <td>${order.phone}</td>
      <td>${order.cylinderType.charAt(0).toUpperCase() + order.cylinderType.slice(1)}</td>
      <td>${order.quantity}</td>
      <td><strong>${formatCurrency(order.total)}</strong></td>
      <td><span class="admin-badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
      <td>${formatDate(order.createdAt)}</td>
    </tr>
  `).join('');
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
export function initHistory() {
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
    clearFiltersBtn.addEventListener('click', () => {
      currentFilters = {
        dateFrom: '',
        dateTo: '',
        status: 'all'
      };
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      renderHistory();
      renderAnalytics();
    });
  }

  // Export button
  const exportBtn = document.getElementById('history-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportOrders);
  }

  // Initial render
  renderHistory();
  renderAnalytics();
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistory);
} else {
  initHistory();
}

