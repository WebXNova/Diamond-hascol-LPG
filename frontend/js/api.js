/**
 * Centralized API configuration
 * All API endpoints and base URL configuration
 */

const API_CONFIG = {
  baseURL: 'http://localhost:5000',
  endpoints: {
    order: '/api/order',
    orders: '/api/orders',
    coupons: '/api/coupons',
    products: '/api/products',
    contact: '/api/contact',
    adminOrders: '/api/admin/orders',
    adminMessages: '/api/admin/messages',
    adminCoupons: '/api/admin/coupons',
    adminProducts: '/api/admin/products',
  },
};

/**
 * Get full API URL for an endpoint
 * @param {string} endpoint - Endpoint path (e.g., 'orders', 'contact', 'adminOrders', 'adminMessages')
 * @returns {string} Full URL
 */
function getApiUrl(endpoint) {
  const path = API_CONFIG.endpoints[endpoint];
  if (!path) {
    throw new Error(`Unknown API endpoint: ${endpoint}`);
  }
  return `${API_CONFIG.baseURL}${path}`;
}

/**
 * Make API request
 * @param {string} endpoint - Endpoint name ('orders', 'contact', 'adminOrders', 'adminMessages', etc.)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  return fetch(url, mergedOptions);
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  window.getApiUrl = getApiUrl;
  window.apiRequest = apiRequest;
}

