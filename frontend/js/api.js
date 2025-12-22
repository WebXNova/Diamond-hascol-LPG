/**
 * Centralized API configuration
 * All API endpoints and base URL configuration
 */

// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  // Check for environment variable (set via build process or runtime)
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  // Check for meta tag (can be set in HTML)
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector('meta[name="api-base-url"]');
    if (metaTag && metaTag.content) {
      return metaTag.content;
    }
  }
  // Fallback to localhost for development
  return 'http://localhost:5000';
};

const API_CONFIG = {
  baseURL: getApiBaseUrl(),
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
    adminAuth: '/api/admin/auth',
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
 * Get authentication token from AdminAuth
 */
function getAuthToken() {
  if (typeof window !== 'undefined' && window.AdminAuth && typeof window.AdminAuth.getAuthToken === 'function') {
    return window.AdminAuth.getAuthToken();
  }
  return null;
}

/**
 * Make API request (public endpoints)
 * @param {string} endpoint - Endpoint name ('orders', 'contact', etc.)
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

/**
 * Make authenticated API request (admin endpoints)
 * Automatically adds Authorization header with JWT token
 * @param {string} endpoint - Endpoint name ('adminOrders', 'adminMessages', etc.)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function authenticatedApiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    // Redirect to login if no token
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = '/admin/login.html';
    }
    throw new Error('Authentication required');
  }

  const url = getApiUrl(endpoint);
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

  const response = await fetch(url, mergedOptions);

  // If unauthorized, redirect to login
  if (response.status === 401) {
    if (typeof window !== 'undefined' && window.AdminAuth && typeof window.AdminAuth.logout === 'function') {
      await window.AdminAuth.logout();
    }
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = '/admin/login.html';
    }
    throw new Error('Authentication failed');
  }

  return response;
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  window.getApiUrl = getApiUrl;
  window.apiRequest = apiRequest;
  window.authenticatedApiRequest = authenticatedApiRequest;
  window.getAuthToken = getAuthToken;
}
