/**
 * Products Loader
 * Fetches real product data from API and renders on home page
 * Handles out-of-stock products with visual indicators
 * Uses safe rendering to prevent XSS
 */

(function() {
  'use strict';

  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) {
    console.warn('Products grid not found');
    return;
  }

  // Wait for safe-render utility to load
  const waitForSafeRender = (maxAttempts = 10) => {
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        if (window.SafeRender || attempts >= maxAttempts) {
          resolve(window.SafeRender);
        } else {
          attempts++;
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  /**
   * Format currency
   */
  function formatCurrency(amount) {
    return `₨${amount.toLocaleString('en-PK')}`;
  }

  /**
   * Fetch products from API
   */
  async function fetchProducts() {
    try {
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('products') 
        : 'http://localhost:5000/api/products';
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch products:', response.status, response.statusText);
        return [];
      }

      const result = await response.json();
      
      if (!result.success || !Array.isArray(result.data)) {
        console.error('Invalid products response:', result);
        return [];
      }

      // Filter to only Domestic and Commercial (exclude refilling)
      return result.data.filter(product => 
        product.category === 'Domestic' || product.category === 'Commercial'
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Render products on home page
   */
  function renderProducts(products) {
    if (!productsGrid) return;

    // Preserve refilling card from original HTML
    const refillingCard = document.querySelector('.product-card[data-product-type="refilling"]');
    const refillingCardHTML = refillingCard ? refillingCard.outerHTML : '';

    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p>Products are currently unavailable. Please check back later.</p>
        </div>
        ${refillingCardHTML}
      `;
      return;
    }

    // Map products to HTML using safe rendering
    const SafeRender = window.SafeRender;
    const productsHTML = products.map(product => {
      // Use safe rendering utility if available, otherwise fallback to manual escaping
      if (SafeRender && SafeRender.renderProductCard) {
        return SafeRender.renderProductCard(product);
      }
      
      // Fallback: Manual escaping (less safe but better than nothing)
      const escapeHtml = (str) => {
        if (typeof str !== 'string') str = String(str);
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, (m) => map[m]);
      };
      
      const isOutOfStock = product.inStock === false;
      const productType = (product.category || '').toLowerCase();
      const productId = product.id || productType;
      
      const imageUrl = product.imageUrl || 
        (productType === 'domestic' ? './public/domesticcylinder.png' : './public/commercilcylinder.png');
      
      const productName = escapeHtml(product.name || `Buy ${product.category || 'Product'} LPG Cylinder`);
      const productCategory = escapeHtml(product.category || 'N/A');
      const productDescription = escapeHtml(product.description || 'No description available.');
      const productPrice = product.price ? formatCurrency(product.price) : '';

      return `
        <div class="product-card ${isOutOfStock ? 'product-card--out-of-stock' : ''}" 
             data-product-id="${escapeHtml(String(productId))}" 
             data-product-type="${escapeHtml(productType)}">
          ${isOutOfStock ? '<div class="product-out-of-stock-badge">Out of Stock</div>' : ''}
          <div class="product-image">
            <img src="${escapeHtml(imageUrl)}" 
                 alt="${productName}" 
                 style="${isOutOfStock ? 'filter: grayscale(100%); opacity: 0.6;' : ''}"
                 loading="lazy">
          </div>
          <h3 class="product-card__name">${productName}</h3>
          <div class="product-card__category" style="margin: 0 20px 10px; padding: 0.5rem 1rem; background: rgba(11, 74, 166, 0.1); border-radius: 6px; display: inline-block; font-size: 0.875rem; font-weight: 600; color: var(--color-brand);">
            <span style="opacity: 0.7;">Category:</span> ${productCategory}
          </div>
          <p class="product-card__description">${productDescription}</p>
          ${productPrice ? `
            <div class="product-price" style="margin: 1rem 20px; padding: 1rem; background: linear-gradient(135deg, rgba(11, 74, 166, 0.1) 0%, rgba(11, 74, 166, 0.05) 100%); border-radius: 8px; border-left: 4px solid var(--color-brand);">
              <div style="font-size: 0.875rem; color: var(--text-700); margin-bottom: 0.25rem; font-weight: 500;">Price (PKR)</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-brand);">${productPrice}</div>
            </div>
          ` : ''}
          ${productType === 'commercial' ? `
            <div style="margin: 0 20px 1rem; padding: 0.75rem; background: rgba(11, 74, 166, 0.05); border-radius: 8px; font-size: 0.9rem; color: var(--text-700);">
              <strong>✓ Bulk order discounts</strong><br>
              <strong>✓ Fast delivery for businesses</strong>
            </div>
          ` : ''}
          <div class="product-card__actions">
            <button type="button" 
                    class="btn btn-secondary product-view-desc-btn" 
                    data-product-id="${escapeHtml(String(productId))}"
                    ${isOutOfStock ? 'disabled' : ''}>
              View Details
            </button>
            <button type="button" 
                    class="btn btn-primary product-buy-now-btn ${isOutOfStock ? 'btn--disabled' : ''}" 
                    data-product-id="${escapeHtml(String(productId))}"
                    ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Preserve refilling card from original HTML
    {
      const refillingCard = document.querySelector('.product-card[data-product-type="refilling"]');
      if (refillingCard) {
        const refillingHTML = refillingCard.outerHTML;
        productsGrid.innerHTML = productsHTML + refillingHTML;
      } else {
        productsGrid.innerHTML = productsHTML;
      }
    }
  }

  /**
   * Initialize products on page load
   */
  async function initProducts() {
    // Wait for safe-render utility
    await waitForSafeRender();
    
    // Show loading state
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <p>Loading products...</p>
      </div>
    `;

    try {
      const products = await fetchProducts();
      renderProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--color-danger);">
          <p>Failed to load products. Please refresh the page.</p>
        </div>
      `;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProducts);
  } else {
    initProducts();
  }
})();

