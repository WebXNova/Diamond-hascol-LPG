/**
 * Products Management Module
 * Handles editing of two fixed products (Commercial & Domestic)
 * Connected to backend API
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
 * Fetch products from backend API
 */
async function fetchProducts() {
  try {
    isLoading = true;
    const apiUrl = getAdminProductsApiUrl();
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    showNotification('Failed to load products. Please refresh the page.', 'error');
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
        <button class="admin-btn admin-btn--primary" onclick="editProduct(${product.id})" style="flex: 1;">
          Edit
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Close product form
 */
function closeProductForm() {
  document.getElementById('product-form-modal').style.display = 'none';
  editingProductId = null;
  // Reset form
  document.getElementById('product-form').reset();
  const preview = document.getElementById('product-image-preview');
  preview.classList.remove('show');
  preview.src = '';
}

/**
 * Preview image before upload
 */
function previewImage(input) {
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
}

/**
 * Edit product
 */
async function editProduct(id) {
  const product = currentProducts.find(p => p.id === id);
  if (!product) {
    showNotification('Product not found', 'error');
    return;
  }

  editingProductId = id;
  document.getElementById('product-form-title').textContent = `Edit ${product.category} Product`;
  document.getElementById('product-name').value = product.name || '';
  document.getElementById('product-category').value = product.category || '';
  document.getElementById('product-description').value = product.description || '';
  document.getElementById('product-price').value = product.price || '';
  document.getElementById('product-in-stock').checked = product.inStock !== false;
  
  // Reset image input
  const imageInput = document.getElementById('product-image');
  if (imageInput) {
    imageInput.value = '';
  }
  
  // Show existing image if available
  const preview = document.getElementById('product-image-preview');
  if (product.imageUrl) {
    preview.src = product.imageUrl;
    preview.classList.add('show');
  } else {
    preview.classList.remove('show');
    preview.src = '';
  }
  
  document.getElementById('product-form-modal').style.display = 'flex';
}

/**
 * Save product (update only)
 */
async function saveProduct(event) {
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
    const response = await fetch(`${baseUrl}/${editingProductId}`, {
      method: 'PATCH',
      body: formData,
    });

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
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Simple alert for now - can be enhanced with a toast system
  if (type === 'error') {
    alert('Error: ' + message);
  } else {
    alert(message);
  }
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
});
