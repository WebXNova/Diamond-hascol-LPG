/**
 * Safe DOM Rendering Utility
 * Prevents XSS by escaping HTML and providing safe rendering methods
 */

(function() {
  'use strict';

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for HTML
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') {
      str = String(str);
    }
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Safely set text content (prevents XSS)
   * @param {HTMLElement} element - Element to set text on
   * @param {string} text - Text to set
   */
  function setTextContent(element, text) {
    if (!element) return;
    element.textContent = text || '';
  }

  /**
   * Safely set innerHTML with escaped content
   * Only use when you need HTML structure, but escape all user data
   * @param {HTMLElement} element - Element to set HTML on
   * @param {string} html - HTML string (user data will be escaped)
   */
  function setSafeHtml(element, html) {
    if (!element) return;
    // For now, use textContent for safety - can be enhanced later if needed
    element.textContent = html || '';
  }

  /**
   * Safely render product data into HTML string
   * Escapes all user-controlled fields
   * @param {Object} product - Product object
   * @param {Object} options - Rendering options
   * @returns {string} Safe HTML string
   */
  function renderProductCard(product, options = {}) {
    const isOutOfStock = product.inStock === false;
    const productType = (product.category || '').toLowerCase();
    const productId = product.id || productType;
    
    // Escape all user-controlled data
    const safeName = escapeHtml(product.name || `Buy ${product.category || 'Product'} LPG Cylinder`);
    const safeCategory = escapeHtml(product.category || 'N/A');
    const safeDescription = escapeHtml(product.description || 'No description available.');
    
    // Image URL - validate it's a safe URL
    let imageUrl = product.imageUrl || '';
    if (imageUrl && !imageUrl.match(/^https?:\/\//) && !imageUrl.startsWith('./') && !imageUrl.startsWith('/')) {
      imageUrl = productType === 'domestic' ? './public/domesticcylinder.png' : './public/commercilcylinder.png';
    }
    if (!imageUrl) {
      imageUrl = productType === 'domestic' ? './public/domesticcylinder.png' : './public/commercilcylinder.png';
    }
    
    // Price formatting (safe - numbers only)
    const productPrice = product.price ? `₨${Number(product.price).toLocaleString('en-PK')}` : '';
    
    // Build safe HTML with escaped user data
    return `
      <div class="product-card ${isOutOfStock ? 'product-card--out-of-stock' : ''}" 
           data-product-id="${escapeHtml(String(productId))}" 
           data-product-type="${escapeHtml(productType)}">
        ${isOutOfStock ? '<div class="product-out-of-stock-badge">Out of Stock</div>' : ''}
        
        <!-- Product Image -->
        <div class="product-image">
          <img src="${escapeHtml(imageUrl)}" 
               alt="${safeName}" 
               style="${isOutOfStock ? 'filter: grayscale(100%); opacity: 0.6;' : ''}"
               loading="lazy">
        </div>
        
        <!-- Product Name -->
        <h3 class="product-card__name">${safeName}</h3>
        
        <!-- Category -->
        <div class="product-card__category" style="margin: 0 20px 10px; padding: 0.5rem 1rem; background: rgba(11, 74, 166, 0.1); border-radius: 6px; display: inline-block; font-size: 0.875rem; font-weight: 600; color: var(--color-brand);">
          <span style="opacity: 0.7;">Category:</span> ${safeCategory}
        </div>
        
        <!-- Description -->
        <p class="product-card__description">${safeDescription}</p>
        
        <!-- Price (PKR) -->
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
  }

  // Export for use in other files
  if (typeof window !== 'undefined') {
    window.SafeRender = {
      escapeHtml,
      setTextContent,
      setSafeHtml,
      renderProductCard
    };
  }
})();

