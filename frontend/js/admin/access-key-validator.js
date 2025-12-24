/**
 * Frontend Access Key Validator
 * Validates admin access key from URL parameter
 * Redirects to 404.html if key is missing or invalid
 * 
 * This script must run IMMEDIATELY before any content loads
 */

(function() {
  'use strict';

  // Hide page content immediately while checking
  if (document.body) {
    document.body.style.display = 'none';
  }
  if (document.documentElement) {
    document.documentElement.style.visibility = 'hidden';
  }

  /**
   * Get access key from URL parameters
   */
  function getAccessKey() {
    if (typeof window === 'undefined' || !window.location) {
      return null;
    }
    
    const params = new URLSearchParams(window.location.search);
    return params.get('key') || params.get('access') || null;
  }

  /**
   * Check if current path is an admin page
   */
  function isAdminPage() {
    if (typeof window === 'undefined' || !window.location) {
      return false;
    }
    
    const path = window.location.pathname.toLowerCase();
    return path.startsWith('/admin/') || path.startsWith('admin/');
  }

  /**
   * Redirect to 404 page
   */
  function redirectTo404() {
    // Use absolute path to ensure it works from any location
    const basePath = window.location.origin;
    window.location.replace(basePath + '/404.html');
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
   * Validate access key
   */
  function validateAccessKey() {
    // Only validate on admin pages
    if (!isAdminPage()) {
      showContent();
      return;
    }

    // Get key from URL
    const key = getAccessKey();

    // If key is missing, redirect to 404
    if (!key || key.trim() === '') {
      redirectTo404();
      return;
    }

    // Key exists, allow page to load
    showContent();
  }

  // Run validation immediately (don't wait for DOM ready)
  validateAccessKey();

  // Also run on DOM ready as backup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateAccessKey);
  } else {
    validateAccessKey();
  }

  // Export for use in other scripts if needed
  if (typeof window !== 'undefined') {
    window.AdminAccessKeyValidator = {
      getAccessKey,
      validateAccessKey
    };
  }
})();

