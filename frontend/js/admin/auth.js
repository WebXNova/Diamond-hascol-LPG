/**
 * Admin Authentication Module
 * Handles login, logout, and session management
 * Connected to backend API
 */

const AUTH_STORAGE_KEY = 'admin_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Get API base URL
function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.API_CONFIG) {
    return window.API_CONFIG.baseURL;
  }
  return 'http://localhost:5000';
}

/**
 * Get current session from storage
 */
export function getSession() {
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session expired
    if (now > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (e) {
    console.error('Error reading session:', e);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Create a new session
 */
function createSession(token, adminData) {
  const session = {
    token: token,
    admin: adminData,
    expiresAt: Date.now() + SESSION_DURATION,
    createdAt: Date.now()
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * Clear session (logout)
 */
export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Logout (alias for clearSession)
 */
export function logout() {
  clearSession();
}

/**
 * Real login function - calls backend API
 * 
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export async function login(email, password) {
  try {
    const apiUrl = `${getApiBaseUrl()}/api/admin/auth/login`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await response.json();
    } catch (_) {
      const text = await response.text().catch(() => '');
      return {
        success: false,
        error: text || `Login failed (HTTP ${response.status})`
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Login failed (HTTP ${response.status})`
      };
    }

    // Create session with real token from backend
    const session = createSession(data.data.token, data.data.admin);

    return {
      success: true,
      session
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.'
    };
  }
}

/**
 * Verify token with backend
 */
export async function verifyToken() {
  const session = getSession();
  if (!session || !session.token) {
    return { success: false, error: 'No session found' };
  }

  try {
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
      clearSession();
      return { success: false, error: data.error || 'Token verification failed' };
    }

    return { success: true, admin: data.data.admin };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Network error during verification' };
  }
}

/**
 * Logout from backend (invalidate token)
 */
export async function logoutFromBackend() {
  const session = getSession();
  if (!session || !session.token) {
    clearSession();
    return { success: true };
  }

  try {
    const apiUrl = `${getApiBaseUrl()}/api/admin/auth/logout`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => {
      // Continue even if backend logout fails
    });

    clearSession();
    return { success: true };
  } catch (error) {
    // Clear session even if backend call fails
    clearSession();
    return { success: true };
  }
}

/**
 * Get current admin user
 */
export function getCurrentAdmin() {
  const session = getSession();
  return session ? session.admin : null;
}

/**
 * Get auth token (for API calls)
 */
export function getAuthToken() {
  const session = getSession();
  return session ? session.token : null;
}

// Expose globally for easy access
window.AdminAuth = {
  login,
  logout: logoutFromBackend,
  isAuthenticated,
  getCurrentAdmin,
  getAuthToken,
  getSession,
  verifyToken,
};
