/**
 * Products Management Module
 * Handles editing of two fixed products (Commercial & Domestic)
 * Connected to backend API with strict authentication
 */

let currentProducts = [];
let isLoading = false;
let editingProductId = null;

/**
 * Get API URL helper - uses global getApiUrl if available, otherwise fallback
 */
function getAdminProductsApiUrl() {
  // Use global getApiUrl if available (from api.js)
  // Check that it's actually a function and not this function itself
  if (typeof window !== 'undefined' && 
      typeof window.getApiUrl === 'function' && 
      window.getApiUrl !== getAdminProductsApiUrl) {
    try {
      return window.getApiUrl('adminProducts');
    } catch (e) {
      console.warn('Error using global getApiUrl, using fallback:', e);
      // Fall through to fallback
    }
  }
  // Fallback if API config not loaded
  return 'http://localhost:5000/api/admin/products';
}

/**
 * Get auth token safely with retry
 */
async function getAuthTokenWithRetry(maxRetries = 10, delay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (window.getAuthToken && typeof window.getAuthToken === 'function') {
        const token = window.getAuthToken();
        if (token) return token;
      }
      // Fallback: get from localStorage directly
      const sessionData = localStorage.getItem('admin_auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.token) return session.token;
      }
    } catch (e) {
      // Continue to retry
    }
    
    // Wait before retrying
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

/**
 * Fetch products from backend API
 */
async function fetchProducts() {
  try {
    isLoading = true;
    const apiUrl = getAdminProductsApiUrl();
    
    // Get auth token with retry (wait for auth modules to load)
    const token = await getAuthTokenWithRetry();
    
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('admin_auth_session');
      window.location.replace('/admin/login.html');
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      currentProducts = data.data;
      renderProducts();
      return currentProducts;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Don't show error if redirecting to login
    if (!error.message.includes('Session expired') && !error.message.includes('Authentication required')) {
      showNotification('Failed to load products. Please refresh the page.', 'error');
    }
    return [];
  } finally {
    isLoading = false;
  }
}

/**
 * Render products grid - Only shows two fixed products
 */
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (currentProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-500);">
        <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">No products found.</p>
        <p>Please ensure both Commercial and Domestic products exist in the database.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = currentProducts.map(product => `
    <div class="admin-product-card">
      ${product.imageUrl 
        ? `<img src="${product.imageUrl}" alt="${product.name}" class="admin-product-card__image">`
        : `<div class="admin-product-card__image-placeholder">No Image</div>`
      }
      <h3 class="admin-product-card__name">${escapeHtml(product.name)}</h3>
      <div class="admin-product-card__details">
        <div class="admin-product-card__detail-row">
          <span>Category:</span>
          <span>${escapeHtml(product.category || 'N/A')}</span>
        </div>
        ${product.description ? `<div class="admin-product-card__detail-row" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;">
          <span>Description:</span>
          <span style="color: var(--text-600); font-size: 0.875rem;">${escapeHtml(product.description)}</span>
        </div>` : ''}
        <div class="admin-product-card__detail-row">
          <span>Price:</span>
          <span class="admin-product-card__price">₨${(product.price || 0).toLocaleString('en-PK')}</span>
        </div>
        <div class="admin-product-card__detail-row">
          <span>Stock:</span>
          <span class="admin-product-card__stock-badge ${product.inStock ? 'admin-product-card__stock-badge--in' : 'admin-product-card__stock-badge--out'}">
            ${product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
      <div class="admin-product-card__actions">
        <button class="admin-btn admin-btn--primary" onclick="window.editProduct(${product.id})" style="flex: 1;" data-product-id="${product.id}">
          Edit
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Close product form
 */
window.closeProductForm = function() {
  const modal = document.getElementById('product-form-modal');
  if (modal) {
    modal.classList.remove('show');
  }
  document.body.style.overflow = ''; // Restore scrolling
  editingProductId = null;
  // Reset form
  const form = document.getElementById('product-form');
  if (form) {
    form.reset();
  }
  const preview = document.getElementById('product-image-preview');
  if (preview) {
    preview.classList.remove('show');
    preview.src = '';
  }
};

/**
 * Preview image before upload
 */
window.previewImage = function(input) {
  const preview = document.getElementById('product-image-preview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.classList.add('show');
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    preview.classList.remove('show');
  }
};

/**
 * Edit product
 */
window.editProduct = function(id) {
  try {
    console.log('Edit product called with ID:', id);
    
    // Convert id to number if it's a string
    const productId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Find product
    const product = currentProducts.find(p => p.id === productId || p.id === productId.toString());
    if (!product) {
      console.error('Product not found. ID:', productId, 'Available products:', currentProducts.map(p => p.id));
      showNotification('Product not found', 'error');
      return;
    }

    console.log('Found product:', product);

    // Check if modal elements exist
    const modal = document.getElementById('product-form-modal');
    const titleEl = document.getElementById('product-form-title');
    const nameEl = document.getElementById('product-name');
    const categoryEl = document.getElementById('product-category');
    const descriptionEl = document.getElementById('product-description');
    const priceEl = document.getElementById('product-price');
    const inStockEl = document.getElementById('product-in-stock');
    const imageInput = document.getElementById('product-image');
    const preview = document.getElementById('product-image-preview');

    if (!modal) {
      console.error('Modal element not found: product-form-modal');
      showNotification('Form modal not found. Please refresh the page.', 'error');
      return;
    }

    if (!titleEl || !nameEl || !categoryEl || !descriptionEl || !priceEl || !inStockEl) {
      console.error('Form elements not found');
      showNotification('Form elements not found. Please refresh the page.', 'error');
      return;
    }

    // Set editing product ID
    editingProductId = productId;

    // Populate form fields
    titleEl.textContent = `Edit ${product.category} Product`;
    nameEl.value = product.name || '';
    categoryEl.value = product.category || '';
    descriptionEl.value = product.description || '';
    priceEl.value = product.price || '';
    inStockEl.checked = product.inStock !== false;
    
    // Reset image input
    if (imageInput) {
      imageInput.value = '';
    }
    
    // Show existing image if available
    if (preview) {
      if (product.imageUrl) {
        preview.src = product.imageUrl;
        preview.classList.add('show');
      } else {
        preview.classList.remove('show');
        preview.src = '';
      }
    }
    
    // Show modal - use CSS class instead of inline style
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    console.log('Modal displayed successfully');
    
  } catch (error) {
    console.error('Error in editProduct:', error);
    showNotification('Failed to open edit form: ' + error.message, 'error');
  }
};

/**
 * Save product (update only)
 */
window.saveProduct = async function(event) {
  event.preventDefault();

  if (!editingProductId) {
    showNotification('No product selected for editing', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', document.getElementById('product-name').value.trim());
  formData.append('category', document.getElementById('product-category').value);
  formData.append('description', document.getElementById('product-description').value.trim() || '');
  formData.append('price', document.getElementById('product-price').value);
  // Convert boolean to string for FormData
  formData.append('inStock', document.getElementById('product-in-stock').checked ? 'true' : 'false');

  const imageInput = document.getElementById('product-image');
  if (imageInput.files && imageInput.files[0]) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    const baseUrl = getAdminProductsApiUrl();
    
    // Get auth token with retry
    const token = await getAuthTokenWithRetry();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${baseUrl}/${editingProductId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('admin_auth_session');
      window.location.replace('/admin/login.html');
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update product');
    }

    const data = await response.json();
    if (data.success) {
      showNotification('Product updated successfully!', 'success');
      
      // Update the product in currentProducts array immediately for instant UI update
      const updatedProduct = data.data;
      const index = currentProducts.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        currentProducts[index] = updatedProduct;
        renderProducts(); // Re-render cards with updated data
      } else {
        // If not found, refresh from server
        await fetchProducts();
      }
      
      closeProductForm();
    } else {
      throw new Error(data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showNotification(error.message || 'Failed to update product. Please try again.', 'error');
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
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize products page
 * Waits for auth to be ready before fetching
 */
export async function initProducts() {
  // Show loading state
  const grid = document.getElementById('products-grid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-500);">
        <p>Loading products...</p>
      </div>
    `;
  }

  // Wait for auth to be ready, then fetch products
  try {
    await fetchProducts();
  } catch (error) {
    console.error('Failed to initialize products page:', error);
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-danger);">
          <p>Failed to load products: ${error.message}</p>
          <button onclick="location.reload()" class="admin-btn admin-btn--primary" style="margin-top: 1rem;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Add event delegation for edit buttons (fallback if onclick doesn't work)
function setupEditButtonListeners() {
  const grid = document.getElementById('products-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-product-id]');
      if (button && button.textContent.trim() === 'Edit') {
        const productId = button.getAttribute('data-product-id');
        if (productId) {
          const id = parseInt(productId, 10);
          if (!isNaN(id)) {
            window.editProduct(id);
          }
        }
      }
    });
  }
}

// Auto-initialize - wait for DOM and auth modules
// Wait for router.js to finish authentication check first
async function waitForAuthAndInit() {
  // Wait for router to show content (indicates auth is verified)
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max wait
  
  while (attempts < maxAttempts) {
    // Check if router has verified auth (body is visible)
    if (document.body && document.body.style.display !== 'none') {
      // Auth verified, wait a bit more for api.js to load
      await new Promise(resolve => setTimeout(resolve, 200));
      await initProducts();
      // Setup event listeners after products are rendered
      setTimeout(setupEditButtonListeners, 100);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // Fallback: try to init anyway after timeout
  console.warn('Auth verification timeout, initializing products anyway');
  await initProducts();
  setTimeout(setupEditButtonListeners, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForAuthAndInit);
} else {
  waitForAuthAndInit();
}
