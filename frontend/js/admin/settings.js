/**
 * Settings Module
 * Comprehensive admin settings management for LPG Agency
 */

import { getCurrentAdmin } from './auth.js';

// Profile settings data structure
let currentSettings = {
  profile: {
    name: 'Admin User',
    email: 'admin@diamondhascol.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
};

/**
 * Load current settings
 */
function loadSettings() {
  const admin = getCurrentAdmin();
  if (admin) {
    currentSettings.profile.name = admin.name || 'Admin User';
    currentSettings.profile.email = admin.email || 'admin@diamondhascol.com';
  }

  // Load from localStorage (mock persistence)
  const savedSettings = localStorage.getItem('admin_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      currentSettings = { ...currentSettings, ...parsed };
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  renderSettings();
}

/**
 * Save settings (mock - UI only)
 */
function saveSettings() {
  // In production: PATCH /api/admin/settings
  localStorage.setItem('admin_settings', JSON.stringify(currentSettings));
  showNotification('Settings saved successfully', 'success');
}

/**
 * Render profile settings
 */
function renderProfileSettings() {
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  
  if (nameInput) nameInput.value = currentSettings.profile.name;
  if (emailInput) emailInput.value = currentSettings.profile.email;
}

/**
 * Render all settings
 */
function renderSettings() {
  renderProfileSettings();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
    color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideIn 0.3s var(--ease-out);
    max-width: 400px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s var(--ease-out)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Handle profile form submission
 */
window.saveProfileSettings = function(e) {
  e.preventDefault();

  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const currentPassword = document.getElementById('profile-current-password').value;
  const newPassword = document.getElementById('profile-new-password').value;
  const confirmPassword = document.getElementById('profile-confirm-password').value;

  if (!name) {
    showNotification('Name is required', 'error');
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword) {
      showNotification('Please enter your current password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
  }

  currentSettings.profile.name = name;
  currentSettings.profile.email = email;
  if (newPassword) {
    currentSettings.profile.newPassword = newPassword;
  }

  saveSettings();
  
  document.getElementById('profile-current-password').value = '';
  document.getElementById('profile-new-password').value = '';
  document.getElementById('profile-confirm-password').value = '';
};


/**
 * Initialize settings page
 */
export function initSettings() {
  loadSettings();
  // Profile panel is always active, no tab switching needed
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettings);
} else {
  initSettings();
}
