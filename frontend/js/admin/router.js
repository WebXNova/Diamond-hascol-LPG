/**
 * Admin Router Module
 * Handles route protection and navigation
 */

import { isAuthenticated } from './auth.js';

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
  'history.html'
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
 * Initialize route protection
 * Redirects to login if not authenticated on protected routes
 */
export function initRouter() {
  // Skip protection on login page
  if (isLoginPage()) {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      window.location.href = `${ADMIN_BASE_PATH}/dashboard.html`;
    }
    return;
  }

  // Protect all other admin routes
  if (isProtectedRoute() && !isAuthenticated()) {
    window.location.href = LOGIN_PATH;
    return;
  }

  // Route is protected and user is authenticated
  return true;
}

/**
 * Navigate to an admin page
 */
export function navigateTo(page) {
  if (!isAuthenticated() && page !== 'login.html') {
    window.location.href = LOGIN_PATH;
    return;
  }

  window.location.href = `${ADMIN_BASE_PATH}/${page}`;
}

/**
 * Logout and redirect to login
 */
export function logout() {
  const { clearSession } = window.AdminAuth || {};
  if (clearSession) {
    clearSession();
  }
  window.location.href = LOGIN_PATH;
}

// Expose globally
window.AdminRouter = {
  initRouter,
  navigateTo,
  logout
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  initRouter();
}

