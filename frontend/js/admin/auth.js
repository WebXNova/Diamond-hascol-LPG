/**
 * Admin Authentication Module
 * Handles login, logout, and session management
 * Uses localStorage for mock authentication (will be replaced with API calls)
 */

import { MOCK_ADMIN } from '../../data/mock-data.js';

const AUTH_STORAGE_KEY = 'admin_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
function createSession(adminData) {
  const session = {
    token: `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
 * Mock login function
 * In production, this will call: POST /api/admin/auth/login
 * 
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export async function login(email, password) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Validate credentials (mock)
  if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    const session = createSession({
      id: MOCK_ADMIN.id,
      email: MOCK_ADMIN.email,
      name: MOCK_ADMIN.name
    });

    return {
      success: true,
      session
    };
  }

  return {
    success: false,
    error: 'Invalid email or password'
  };
}

/**
 * Get current admin user
 */
export function getCurrentAdmin() {
  const session = getSession();
  return session ? session.admin : null;
}

/**
 * Get auth token (for future API calls)
 */
export function getAuthToken() {
  const session = getSession();
  return session ? session.token : null;
}

// Expose globally for easy access
window.AdminAuth = {
  login,
  logout: clearSession,
  isAuthenticated,
  getCurrentAdmin,
  getAuthToken,
  getSession
};

