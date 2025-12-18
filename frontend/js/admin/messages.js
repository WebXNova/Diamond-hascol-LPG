/**
 * Messages Management Module
 * Handles messages list, read/unread status, and message details
 */

import { mockMessages } from '../../data/mock-data.js';

let currentMessages = [...mockMessages];
let currentFilter = 'all'; // all, read, unread

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Filter messages
 */
function filterMessages() {
  let filtered = [...mockMessages];

  if (currentFilter === 'read') {
    filtered = filtered.filter(msg => msg.isRead);
  } else if (currentFilter === 'unread') {
    filtered = filtered.filter(msg => !msg.isRead);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  currentMessages = filtered;
  return filtered;
}

/**
 * Render messages list
 */
function renderMessages() {
  const messagesContainer = document.getElementById('messages-list');
  const filtered = filterMessages();

  if (filtered.length === 0) {
    messagesContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-500);">
        <p style="font-size: var(--fs-2); margin-bottom: 0.5rem;">No messages found</p>
        <p style="font-size: var(--fs-1);">Try adjusting your filters.</p>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = filtered.map(message => `
    <div class="admin-message-item ${!message.isRead ? 'admin-message-item--unread' : ''}" 
         onclick="viewMessage('${message.id}')"
         style="cursor: pointer;">
      <div class="admin-message-item__header">
        <div>
          <strong style="color: var(--text-900);">${message.name}</strong>
          ${!message.isRead ? '<span class="admin-badge admin-badge--pending" style="margin-left: 0.5rem; font-size: 0.7rem;">New</span>' : ''}
        </div>
        <span style="font-size: var(--fs-0); color: var(--text-500);">${formatDate(message.createdAt)}</span>
      </div>
      <div class="admin-message-item__body">
        <p style="color: var(--text-700); margin: 0.5rem 0 0 0; line-height: 1.6;">
          ${message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message}
        </p>
      </div>
      <div class="admin-message-item__meta" style="margin-top: 0.75rem; display: flex; gap: 1rem; font-size: var(--fs-0); color: var(--text-500);">
        <span>📧 ${message.email}</span>
        <span>📞 ${message.phone}</span>
      </div>
    </div>
  `).join('');
}

/**
 * View message details
 */
window.viewMessage = function(messageId) {
  const message = mockMessages.find(m => m.id === messageId);
  if (!message) return;

  // Mark as read
  if (!message.isRead) {
    message.isRead = true;
    renderMessages();
  }

  const modal = document.getElementById('message-details-modal');
  const modalContent = document.getElementById('message-details-content');
  
  modalContent.innerHTML = `
    <div style="display: grid; gap: 1.5rem;">
      <div>
        <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Message Details</h3>
        <div style="display: grid; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-500);">Message ID:</span>
            <strong>${message.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-500);">Date:</span>
            <span>${formatDate(message.createdAt)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-500);">Status:</span>
            <span class="admin-badge ${message.isRead ? 'admin-badge--delivered' : 'admin-badge--pending'}">
              ${message.isRead ? 'Read' : 'Unread'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Contact Information</h3>
        <div style="display: grid; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-500);">Name:</span>
            <strong>${message.name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-500);">Email:</span>
            <a href="mailto:${message.email}" style="color: var(--color-brand); text-decoration: none;">${message.email}</a>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-500);">Phone:</span>
            <a href="tel:${message.phone}" style="color: var(--color-brand); text-decoration: none;">${message.phone}</a>
          </div>
        </div>
      </div>

      <div>
        <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Message</h3>
        <div style="background: var(--bg-1); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <p style="color: var(--text-700); line-height: 1.7; margin: 0; white-space: pre-wrap;">${message.message}</p>
        </div>
      </div>

      <div>
        <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Reply</h3>
        <form id="message-reply-form" onsubmit="return false;">
          <div class="admin-form-group">
            <label for="reply-subject" class="admin-form-label">Subject</label>
            <input
              type="text"
              id="reply-subject"
              class="admin-form-input"
              placeholder="Re: Customer Inquiry"
              value="Re: ${message.message.substring(0, 50)}..."
            >
          </div>
          <div class="admin-form-group">
            <label for="reply-message" class="admin-form-label">Message</label>
            <textarea
              id="reply-message"
              class="admin-form-input"
              rows="6"
              placeholder="Type your reply here..."
              style="resize: vertical; font-family: var(--font-body);"
            ></textarea>
          </div>
          <div style="margin-top: 1rem;">
            <button type="button" class="admin-btn admin-btn--primary" onclick="sendReply('${message.id}')">
              Send Reply
            </button>
            <button type="button" class="admin-btn admin-btn--secondary" onclick="closeMessageDetails()" style="margin-left: 0.5rem;">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modal.classList.add('show');
};

/**
 * Send reply (mock - UI only)
 */
window.sendReply = function(messageId) {
  const subject = document.getElementById('reply-subject').value;
  const message = document.getElementById('reply-message').value;

  if (!message.trim()) {
    alert('Please enter a reply message');
    return;
  }

  // In production: POST /api/admin/messages/:id/reply
  alert(`Reply sent to message ${messageId}\n\nSubject: ${subject}\n\nThis is a mock action. In production, this would send an email.`);
  closeMessageDetails();
};

/**
 * Close message details modal
 */
window.closeMessageDetails = function() {
  const modal = document.getElementById('message-details-modal');
  modal.classList.remove('show');
};

/**
 * Toggle message read status
 */
window.toggleMessageRead = function(messageId) {
  const message = mockMessages.find(m => m.id === messageId);
  if (message) {
    message.isRead = !message.isRead;
    renderMessages();
  }
};

/**
 * Mark all as read
 */
window.markAllAsRead = function() {
  mockMessages.forEach(msg => {
    msg.isRead = true;
  });
  renderMessages();
  showNotification('All messages marked as read', 'success');
};

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
    background: ${type === 'success' ? '#d1fae5' : '#dbeafe'};
    color: ${type === 'success' ? '#065f46' : '#1e40af'};
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideIn 0.3s var(--ease-out);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s var(--ease-out)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Initialize messages page
 */
export function initMessages() {
  // Filter dropdown
  const filterSelect = document.getElementById('messages-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      renderMessages();
    });
  }

  // Mark all as read button
  const markAllReadBtn = document.getElementById('messages-mark-all-read');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
  }

  // Initial render
  renderMessages();
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMessages);
} else {
  initMessages();
}

