/**
 * Strict Authentication Guard
 * Blocks access to admin pages BEFORE any content loads
 * Runs immediately, synchronously where possible
 * 
 * This prevents any user from accessing admin pages without authentication,
 * even by typing the URL directly.
 */

const AUTH_STORAGE_KEY = 'admin_auth_session';
const LOGIN_PATH = '/admin/login.html';

/**
 * Get API base URL
 */
function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.API_CONFIG) {
    return window.API_CONFIG.baseURL;
  }
  return 'http://localhost:5000';
}

/**
 * Check if session exists and is valid (synchronous check)
 */
function hasValidSession() {
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session expired
    if (now > session.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }

    // Session exists and is not expired
    return !!session.token;
  } catch (e) {
    return false;
  }
}

/**
 * Verify token with backend (async)
 */
async function verifyTokenWithBackend() {
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!sessionData) {
      return { success: false, error: 'No session' };
    }

    const session = JSON.parse(sessionData);
    if (!session.token) {
      return { success: false, error: 'No token' };
    }

    const apiUrl = `${getApiBaseUrl()}/api/admin/auth/verify`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Token invalid, clear session
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { success: false, error: data.error || 'Token verification failed' };
    }

    return { success: true, admin: data.data.admin };
  } catch (error) {
    // Network error - be strict, require re-auth
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { success: false, error: 'Network error during verification' };
  }
}

/**
 * Strict auth guard - blocks page load if not authenticated
 * This runs IMMEDIATELY when script loads, before DOM is ready
 */
async function strictAuthGuard() {
  // Check if we're on login page
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('login.html');
  
  if (isLoginPage) {
    // On login page, check if already authenticated
    if (hasValidSession()) {
      // Already logged in, redirect to dashboard
      window.location.replace('/admin/dashboard.html');
      return false; // Block page load
    }
    // Not authenticated, allow login page
    return true;
  }

  // On any other admin page - require authentication
  
  // First, quick synchronous check
  if (!hasValidSession()) {
    // No session at all - immediate redirect
    window.location.replace(LOGIN_PATH);
    return false; // Block page load
  }

  // Session exists, but verify with backend (async)
  const verification = await verifyTokenWithBackend();
  
  if (!verification.success) {
    // Token invalid or expired - redirect to login
    window.location.replace(LOGIN_PATH);
    return false; // Block page load
  }

  // Authenticated and verified - allow page load
  return true;
}

/**
 * Initialize strict guard immediately
 * This runs as soon as the script is loaded
 */
(function() {
  'use strict';
  
  // Show loading screen immediately
  document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Loading...</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: #333;
        }
        .loading-container {
          text-align: center;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-text {
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="loading-container">
        <div class="spinner"></div>
        <div class="loading-text">Verifying authentication...</div>
      </div>
    </body>
    </html>
  `);

  // Run auth guard
  strictAuthGuard().then((allowed) => {
    if (!allowed) {
      // Already redirected, do nothing
      return;
    }
    
    // Auth passed - reload the actual page
    // The router.js will handle the rest
    if (document.readyState === 'loading') {
      // Page hasn't loaded yet, just let it continue
      document.body.innerHTML = '';
      return;
    }
    
    // If we get here and page loaded, something went wrong
    // Redirect to login as fallback
    if (!hasValidSession()) {
      window.location.replace(LOGIN_PATH);
    }
  }).catch((error) => {
    console.error('Auth guard error:', error);
    // On error, redirect to login for security
    window.location.replace(LOGIN_PATH);
  });
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { strictAuthGuard, hasValidSession, verifyTokenWithBackend };
}

