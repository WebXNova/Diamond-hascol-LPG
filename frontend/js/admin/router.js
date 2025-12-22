/**
 * Admin Router Module
 * STRICT MODE: Blocks access immediately, before any content loads
 * Multiple layers of protection to prevent unauthorized access
 */

import { isAuthenticated, verifyToken } from './auth.js';

const ADMIN_BASE_PATH = '/admin';
const LOGIN_PATH = `${ADMIN_BASE_PATH}/login.html`;

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
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      strictRedirect(`${ADMIN_BASE_PATH}/dashboard.html`);
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
      // No session - immediate redirect (no delay)
      strictRedirect(LOGIN_PATH);
      return false;
    }

    // Second check: Verify token with backend (async but blocking)
    try {
      const verification = await verifyToken();
      if (!verification.success) {
        // Token invalid - redirect immediately
        strictRedirect(LOGIN_PATH);
        return false;
      }
      // Token valid - show content
      showContent();
      return true;
    } catch (error) {
      // Network error or verification failed - require re-auth
      strictRedirect(LOGIN_PATH);
      return false;
    }
  }

  // Not a protected route - allow
  return true;
}

/**
 * Navigate to an admin page
 */
export function navigateTo(page) {
  if (!isAuthenticated() && page !== 'login.html') {
    strictRedirect(LOGIN_PATH);
    return;
  }

  window.location.href = `${ADMIN_BASE_PATH}/${page}`;
}

/**
 * Logout and redirect to login
 */
export async function logout() {
  const { logout: logoutFn } = window.AdminAuth || {};
  if (logoutFn) {
    await logoutFn();
  }
  strictRedirect(LOGIN_PATH);
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
