/**
 * Inline Auth Guard - Must be included FIRST in HTML
 * Blocks page rendering until authentication is verified
 * 
 * This is a synchronous blocking version that prevents
 * any content from showing until auth is verified
 */

(function() {
  'use strict';
  
  const AUTH_STORAGE_KEY = 'admin_auth_session';
  const LOGIN_PATH = '/admin/login.html';
  
  function getApiBaseUrl() {
    return window.API_CONFIG?.baseURL || 'http://localhost:5000';
  }
  
  function hasValidSession() {
    try {
      const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!sessionData) return false;
      const session = JSON.parse(sessionData);
      return Date.now() < session.expiresAt && !!session.token;
    } catch (e) {
      return false;
    }
  }
  
  function redirectToLogin() {
    window.location.replace(LOGIN_PATH);
  }
  
  // Check if login page
  const isLoginPage = window.location.pathname.includes('login.html');
  
  if (!isLoginPage) {
    // Not login page - require auth
    if (!hasValidSession()) {
      // No session - immediate redirect
      redirectToLogin();
      // Block page rendering
      document.write('');
      return;
    }
    
    // Has session - verify with backend (async)
    // Show loading state
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <div style="text-align: center;">
          <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <div style="font-size: 14px; color: #666;">Verifying authentication...</div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    // Verify token
    (async function() {
      try {
        const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!sessionData) {
          redirectToLogin();
          return;
        }
        
        const session = JSON.parse(sessionData);
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
          localStorage.removeItem(AUTH_STORAGE_KEY);
          redirectToLogin();
          return;
        }
        
        // Auth verified - reload page to show content
        window.location.reload();
      } catch (error) {
        // Network error - require re-auth
        localStorage.removeItem(AUTH_STORAGE_KEY);
        redirectToLogin();
      }
    })();
  } else {
    // Login page - check if already authenticated
    if (hasValidSession()) {
      // Already logged in, redirect to dashboard
      window.location.replace('/admin/dashboard.html');
    }
  }
})();

