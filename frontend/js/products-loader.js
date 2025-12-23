/**
 * Products Loader
 * Fetches real product data from API and renders on home page
 * Handles out-of-stock products with visual indicators
 * Uses safe rendering to prevent XSS
 */

(function() {
  'use strict';

  // Support both legacy markup (class="products-grid") and newer markup (id="products-grid")
  const productsGrid =
    document.getElementById('products-grid') ||
    document.querySelector('.products-grid');
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

    // UI-only update:
    // - Do NOT re-render / replace cards (keeps existing buttons + event wiring intact)
    // - Do NOT show description on the card
    // - Show only "Price" on the card (fallback-safe)
    if (!Array.isArray(products) || products.length === 0) return;

    const byCategory = new Map(
      products
        .filter((p) => p && (p.category === 'Domestic' || p.category === 'Commercial'))
        .map((p) => [String(p.category).toLowerCase(), p]),
    );

    /** @type {NodeListOf<HTMLElement>} */
    const cards = productsGrid.querySelectorAll('.product-card[data-product-type]');
    cards.forEach((card) => {
      const type = String(card.getAttribute('data-product-type') || '').toLowerCase();
      if (type !== 'domestic' && type !== 'commercial') return;
      const product = byCategory.get(type);
      if (!product) return;

      const priceNumber =
        typeof product.price === 'number'
          ? product.price
          : typeof product.price === 'string'
            ? Number(product.price)
            : NaN;
      const priceText = Number.isFinite(priceNumber) ? formatCurrency(priceNumber) : '—';

      // The first <p> in the card is the short description in current UI.
      // Replace its text with Price to preserve layout/styling but hide description content.
      const descP = card.querySelector('p');
      if (descP) {
        descP.textContent = `Price: ${priceText}`;
      }
    });
  }

  /**
   * Initialize products on page load
   */
  async function initProducts() {
    // Wait for safe-render utility
    await waitForSafeRender();

    try {
      const products = await fetchProducts();
      renderProducts(products);
    } catch (error) {
      // UI-only enhancement should never break the existing page.
      // If product fetch fails, keep the original static UI intact.
      console.error('Failed to load products:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProducts);
  } else {
    initProducts();
  }
})();

