/**
 * Inline Auth Guard - Must be included in <head> of all protected admin pages
 * This runs immediately and blocks page rendering until auth is verified
 * Uses hardcoded API base URL to avoid dependency on api.js
 */

(function() {
  'use strict';
  
  const AUTH_KEY = 'admin_auth_session';
  const LOGIN = '/admin/login.html';
  const API_BASE = 'http://localhost:5000'; // Hardcoded fallback
  
  function hasSession() {
    try {
      const s = localStorage.getItem(AUTH_KEY);
      if (!s) return false;
      const d = JSON.parse(s);
      return Date.now() < d.expiresAt && !!d.token;
    } catch {
      return false;
    }
  }
  
  // Quick check - if no session, redirect immediately
  if (!hasSession()) {
    window.location.replace(LOGIN);
    return;
  }
  
  // Has session - verify with backend (async, non-blocking for page load)
  (async function() {
    try {
      const s = localStorage.getItem(AUTH_KEY);
      if (!s) {
        window.location.replace(LOGIN);
        return;
      }
      
      const d = JSON.parse(s);
      const baseUrl = window.API_CONFIG?.baseURL || API_BASE;
      
      const r = await fetch(baseUrl + '/api/admin/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + d.token,
          'Content-Type': 'application/json'
        }
      });
      
      const j = await r.json();
      
      if (!r.ok || !j.success) {
        localStorage.removeItem(AUTH_KEY);
        window.location.replace(LOGIN);
        return;
      }
      
      // Auth verified - page can continue loading
    } catch (e) {
      console.error('Auth verify error:', e);
      localStorage.removeItem(AUTH_KEY);
      window.location.replace(LOGIN);
    }
  })();
})();

