/**
 * Messages Management Module
 * Handles messages list, read/unread status, and message details
 * Connected to backend API
 */

let currentMessages = [];
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
 * Fetch messages from backend API
 */
async function fetchMessages() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminMessages') : 'http://localhost:5000/api/admin/messages';
    const token = window.getAuthToken ? window.getAuthToken() : null;
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      currentMessages = data.data;
      return currentMessages;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    showNotification('Failed to load messages. Please refresh the page.', 'error');
    return [];
  }
}

/**
 * Filter messages
 */
function filterMessages() {
  let filtered = [...currentMessages];

  if (currentFilter === 'read') {
    filtered = filtered.filter(msg => msg.isRead);
  } else if (currentFilter === 'unread') {
    filtered = filtered.filter(msg => !msg.isRead);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return filtered;
}

/**
 * Render messages list
 */
function renderMessages() {
  const messagesContainer = document.getElementById('messages-list');
  if (!messagesContainer) {
    console.error('Messages container element not found: messages-list');
    return;
  }
  
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
        <span>📞 ${message.phone}</span>
      </div>
    </div>
  `).join('');
}

/**
 * View message details
 */
window.viewMessage = async function(messageId) {
  try {
    // Find message in current list
    const message = currentMessages.find(m => m.id.toString() === messageId.toString());
    if (!message) {
      showNotification('Message not found', 'error');
      return;
    }

    // Mark as read if not already read
    if (!message.isRead) {
      await markMessageAsRead(messageId);
    }

    const modal = document.getElementById('message-details-modal');
    const modalContent = document.getElementById('message-details-content');
    
    if (!modal || !modalContent) {
      console.error('Modal elements not found');
      return;
    }
    
    modalContent.innerHTML = `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <h3 style="font-size: var(--fs-2); font-weight: 600; color: var(--text-900); margin-bottom: 1rem;">Message Details</h3>
          <div style="display: grid; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-500);">Message ID:</span>
              <strong>#${message.id}</strong>
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
      </div>
    `;

    modal.classList.add('show');
    
    // Refresh messages to update read status
    await fetchMessages();
    renderMessages();
  } catch (error) {
    console.error('Error viewing message:', error);
    showNotification('Failed to load message details', 'error');
  }
};

/**
 * Mark message as read via API
 */
async function markMessageAsRead(messageId) {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('adminMessages') : 'http://localhost:5000/api/admin/messages';
    const token = window.getAuthToken ? window.getAuthToken() : null;
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${apiUrl}/${messageId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }

    // Update local state
    const message = currentMessages.find(m => m.id.toString() === messageId.toString());
    if (message) {
      message.isRead = true;
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

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
window.toggleMessageRead = async function(messageId) {
  try {
    const message = currentMessages.find(m => m.id.toString() === messageId.toString());
    if (!message) return;

    if (!message.isRead) {
      await markMessageAsRead(messageId);
    } else {
      // Note: Backend doesn't support unread, but we can implement if needed
      showNotification('Cannot mark as unread', 'info');
      return;
    }

    await fetchMessages();
    renderMessages();
  } catch (error) {
    console.error('Error toggling message read status:', error);
    showNotification('Failed to update message status', 'error');
  }
};

/**
 * Mark all as read
 */
window.markAllAsRead = async function() {
  try {
    const unreadMessages = currentMessages.filter(msg => !msg.isRead);
    
    // Mark each unread message as read
    await Promise.all(unreadMessages.map(msg => markMessageAsRead(msg.id)));
    
    await fetchMessages();
    renderMessages();
    showNotification('All messages marked as read', 'success');
  } catch (error) {
    console.error('Error marking all as read:', error);
    showNotification('Failed to mark all messages as read', 'error');
  }
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
    background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
    color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
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
export async function initMessages() {
  // Show loading state
  const messagesContainer = document.getElementById('messages-list');
  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-500);">
        <p>Loading messages...</p>
      </div>
    `;
  }

  // Fetch messages from backend
  await fetchMessages();
  renderMessages();

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

  // Refresh button (if exists)
  const refreshBtn = document.getElementById('messages-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await fetchMessages();
      renderMessages();
      showNotification('Messages refreshed', 'success');
    });
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMessages);
} else {
  initMessages();
}

