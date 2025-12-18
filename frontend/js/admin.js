/**
 * Shared Admin Utilities
 * Common functions used across admin pages
 */

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return `₨${amount.toLocaleString()}`;
}

/**
 * Format date
 */
export function formatDate(dateString, options = {}) {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Show notification toast
 */
export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe';
  const textColor = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';
  
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${bgColor};
    color: ${textColor};
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
  }, duration);
}

// Expose globally for easy access
window.AdminUtils = {
  formatCurrency,
  formatDate,
  showNotification
};

