/**
 * Admin Router Module
 * STRICT MODE: Blocks access immediately, before any content loads
 * Multiple layers of protection to prevent unauthorized access
 */

import { isAuthenticated, verifyToken } from './auth.js';

const ADMIN_BASE_PATH = '/admin';
const LOGIN_PATH = `${ADMIN_BASE_PATH}/login.html`;

/**
 * Get access key from current URL
 */
function getAccessKey() {
  if (typeof window === 'undefined' || !window.location) return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('key') || params.get('access') || '';
}

/**
 * Preserve access key in URL
 */
function withAccessKey(path) {
  const key = getAccessKey();
  if (!key) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}key=${encodeURIComponent(key)}`;
}

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  'dashboard.html',
  'orders.html',
  'messages.html',
  'coupons.html',
  'history.html',
  'products.html',
  'settings.html'
];

/**
 * Check if current page is a protected route
 */
function isProtectedRoute() {
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop();
  return PROTECTED_ROUTES.includes(currentFile);
}

/**
 * Check if current page is login page
 */
function isLoginPage() {
  const currentPath = window.location.pathname;
  return currentPath.includes('login.html');
}

/**
 * Strict redirect - uses replace to prevent back button
 */
function strictRedirect(path) {
  window.location.replace(path);
}

/**
 * Hide page content immediately
 */
function hideContent() {
  if (document.body) {
    document.body.style.display = 'none';
  }
  if (document.documentElement) {
    document.documentElement.style.visibility = 'hidden';
  }
}

/**
 * Show page content
 */
function showContent() {
  if (document.body) {
    document.body.style.display = '';
  }
  if (document.documentElement) {
    document.documentElement.style.visibility = '';
  }
}

/**
 * Initialize route protection
 * STRICT: Blocks immediately, verifies with backend
 */
export async function initRouter() {
  // Skip protection on login page
  if (isLoginPage()) {
    // If already authenticated, redirect to dashboard (preserve access key)
    if (isAuthenticated()) {
      strictRedirect(withAccessKey(`${ADMIN_BASE_PATH}/dashboard.html`));
      return false;
    }
    return true;
  }

  // Protect all other admin routes - IMMEDIATE CHECK
  if (isProtectedRoute()) {
    // Hide content immediately while checking
    hideContent();
    
    // First check: Does session exist?
    if (!isAuthenticated()) {
      // No session - immediate redirect (preserve access key)
      strictRedirect(withAccessKey(LOGIN_PATH));
      return false;
    }

    // Second check: Verify token with backend (async but blocking)
    try {
      const verification = await verifyToken();
      if (!verification.success) {
        // Token invalid - redirect immediately (preserve access key)
        strictRedirect(withAccessKey(LOGIN_PATH));
        return false;
      }
      // Token valid - show content
      showContent();
      return true;
    } catch (error) {
      // Network error or verification failed - require re-auth (preserve access key)
      strictRedirect(withAccessKey(LOGIN_PATH));
      return false;
    }
  }

  // Not a protected route - allow
  return true;
}

/**
 * Navigate to an admin page (preserves access key)
 */
export function navigateTo(page) {
  if (!isAuthenticated() && page !== 'login.html') {
    strictRedirect(withAccessKey(LOGIN_PATH));
    return;
  }

  window.location.href = withAccessKey(`${ADMIN_BASE_PATH}/${page}`);
}

/**
 * Logout and redirect to login (preserves access key)
 */
export async function logout() {
  const { logout: logoutFn } = window.AdminAuth || {};
  if (logoutFn) {
    await logoutFn();
  }
  strictRedirect(withAccessKey(LOGIN_PATH));
}

// Expose globally
window.AdminRouter = {
  initRouter,
  navigateTo,
  logout
};

// STRICT: Run immediately, don't wait for DOM
// Hide content first, then check auth
hideContent();

(async function() {
  const allowed = await initRouter();
  
  // If not allowed, content stays hidden (redirect will happen)
  if (allowed) {
    showContent();
  }
})();

// Also run on DOM ready as backup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const allowed = await initRouter();
    if (!allowed) {
      hideContent();
    }
  });
} else {
  initRouter();
}
