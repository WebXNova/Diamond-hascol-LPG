(() => {
  'use strict';

  // Map category keys to numeric product IDs
  const mapProductIdToNumeric = (productId) => {
    if (!productId) return null;
    const idStr = String(productId).toLowerCase();
    if (idStr === 'domestic') return 1;
    if (idStr === 'commercial') return 2;
    // If already numeric, return as-is
    const numericId = parseInt(productId, 10);
    if (!isNaN(numericId)) return numericId;
    return null;
  };

  // Static product objects for failsafe (used when API fails or for category keys)
  const getStaticProduct = (productId) => {
    const idStr = String(productId).toLowerCase();
    if (idStr === 'domestic') {
      return {
        id: 1,
        name: 'Domestic LPG Cylinder',
        type: 'domestic',
        category: 'Domestic',
        price: 3200,
        image: './public/domesticcylinder.png',
        description: 'Perfect for home use - safe, reliable, and efficient. Our domestic LPG cylinders are designed for everyday household cooking and heating needs.',
        inStock: true,
        specs: [
          'Standard 45kg capacity - ideal for household use',
          'ISI certified and safety tested - meets all quality standards',
          'Long-lasting and efficient - optimized fuel consumption',
          'Easy to handle and store - compact design for home storage',
          'Compatible with standard regulators - universal compatibility',
          'Durable construction - built to last for years',
          'Safety valve included - ensures safe operation'
        ]
      };
    }
    if (idStr === 'commercial') {
      return {
        id: 2,
        name: 'Commercial LPG Cylinder',
        type: 'commercial',
        category: 'Commercial',
        price: 12800,
        image: './public/commercilcylinder.png',
        description: 'Ideal for businesses and commercial establishments. High-capacity cylinders designed for restaurants, hotels, and industrial use.',
        inStock: true,
        specs: [
          'High-capacity design for commercial use - meets business demands',
          'ISI certified and safety tested - professional grade quality',
          'Durable construction for heavy usage - built for commercial operations',
          'Suitable for restaurants and hotels - perfect for food service industry',
          'Professional grade quality - reliable performance',
          'Enhanced safety features - meets commercial safety standards',
          'Long service life - cost-effective for business operations'
        ]
      };
    }
    return null;
  };

  // Validate productId against allowed set (numeric 1 or 2, or their labels)
  const isValidProductId = (productId) => {
    const mapped = mapProductIdToNumeric(productId);
    return mapped === 1 || mapped === 2;
  };

  // Fetch product from API
  const fetchProduct = async (productId) => {
    // Handle null/undefined productId
    if (!productId) {
      const staticProduct = getStaticProduct('domestic');
      return staticProduct;
    }

    // Map category keys to numeric IDs before API call
    const mappedId = mapProductIdToNumeric(productId);
    if (!mappedId) {
      console.warn('Invalid product ID, using static product:', productId);
      const staticProduct = getStaticProduct(productId);
      return staticProduct || getStaticProduct('domestic'); // Return static product as failsafe
    }

    // Determine category key for static product fallback
    const categoryKey = String(productId).toLowerCase();
    const staticProduct = getStaticProduct(categoryKey) || getStaticProduct('domestic');

    try {
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('products') 
        : 'http://localhost:5000/api/products';
      
      const response = await fetch(`${apiUrl}/${mappedId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch product from API, using static product:', response.status, response.statusText);
        return staticProduct; // Return static product as failsafe instead of null
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.warn('Invalid product response, using static product:', result);
        return staticProduct; // Return static product as failsafe instead of null
      }

      // Transform backend product to match frontend format
      const product = result.data;
      
      // Map category to type for backward compatibility
      const type = product.category?.toLowerCase() || categoryKey;
      
      // Get static product for specs/description fallback based on category
      const fallbackStaticProduct = getStaticProduct(type) || staticProduct;
      
      return {
        id: product.id,
        name: product.name || fallbackStaticProduct.name,
        type: type,
        category: product.category || fallbackStaticProduct.category,
        price: product.price || fallbackStaticProduct.price,
        image: product.imageUrl || fallbackStaticProduct.image,
        description: product.description || fallbackStaticProduct.description,
        inStock: product.inStock !== false, // Explicit check
        specs: fallbackStaticProduct.specs
      };
    } catch (error) {
      console.warn('Error fetching product, using static product:', error);
      return staticProduct; // Return static product as failsafe instead of null
    }
  };

  // ============================================
  // PRODUCT DESCRIPTION MODAL
  // ============================================
  const modal = document.getElementById('product-desc-modal');
  const modalBackdrop = modal?.querySelector('[data-product-desc-backdrop]');
  const modalClose = document.getElementById('product-desc-close');
  const modalTitle = document.getElementById('product-desc-title');
  const modalImage = document.getElementById('product-desc-img');
  const modalDescription = document.getElementById('product-desc-description');
  const modalSpecs = document.getElementById('product-desc-specs');
  const modalPrice = document.getElementById('product-desc-price');
  const modalBuyNow = document.getElementById('product-desc-buy-now');

  let currentProductId = null;
  let lastFocusedElement = null;

  const openDescriptionModal = async (productId) => {
    if (!isValidProductId(productId)) return;
    const product = await fetchProduct(productId);
    if (!product) {
      console.error('Product not found:', productId);
      alert('Product not found. Please try again.');
      return;
    }

    currentProductId = productId;
    lastFocusedElement = document.activeElement;

    // Safe HTML escaping helper
    const escapeHtml = (str) => {
      if (typeof str !== 'string') str = String(str);
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return str.replace(/[&<>"']/g, (m) => map[m]);
    };
    
    // Populate modal with all product details (safely)
    const safeName = escapeHtml(product.name || 'Product');
    modalTitle.textContent = safeName;
    modalImage.src = product.image || '';
    modalImage.alt = safeName;
    
    // Show full description (using DOM manipulation, not innerHTML)
    modalDescription.textContent = '';
    
    const categoryDiv = document.createElement('div');
    categoryDiv.style.marginBottom = '1rem';
    
    const categoryLabel = document.createElement('strong');
    categoryLabel.textContent = 'CATEGORY:';
    categoryLabel.style.color = 'var(--text-700)';
    categoryLabel.style.fontSize = '0.875rem';
    categoryLabel.style.textTransform = 'uppercase';
    categoryLabel.style.letterSpacing = '0.5px';
    
    const categoryValue = document.createElement('span');
    categoryValue.textContent = escapeHtml(product.category || 'N/A');
    categoryValue.style.marginLeft = '0.5rem';
    categoryValue.style.fontWeight = '600';
    categoryValue.style.color = 'var(--color-brand)';
    
    categoryDiv.appendChild(categoryLabel);
    categoryDiv.appendChild(categoryValue);
    modalDescription.appendChild(categoryDiv);
    
    const descDiv = document.createElement('div');
    descDiv.style.marginBottom = '1rem';
    
    const descLabel = document.createElement('strong');
    descLabel.textContent = 'DESCRIPTION:';
    descLabel.style.color = 'var(--text-700)';
    descLabel.style.fontSize = '0.875rem';
    descLabel.style.textTransform = 'uppercase';
    descLabel.style.letterSpacing = '0.5px';
    
    const descText = document.createElement('p');
    descText.textContent = escapeHtml(product.description || 'No description available.');
    descText.style.marginTop = '0.5rem';
    descText.style.lineHeight = '1.6';
    descText.style.color = 'var(--text-600)';
    
    descDiv.appendChild(descLabel);
    descDiv.appendChild(descText);
    modalDescription.appendChild(descDiv);

    // Clear and populate specs (safely)
    modalSpecs.textContent = '';
    if (product.specs && Array.isArray(product.specs)) {
      product.specs.forEach(spec => {
        const li = document.createElement('li');
        li.textContent = spec; // textContent is safe
        modalSpecs.appendChild(li);
      });
    }

    // Format price with label (safely)
    const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
    modalPrice.textContent = '';
    
    const priceLabel = document.createElement('div');
    priceLabel.textContent = 'Price (PKR)';
    priceLabel.style.fontSize = '0.875rem';
    priceLabel.style.color = 'var(--text-700)';
    priceLabel.style.marginBottom = '0.25rem';
    priceLabel.style.fontWeight = '500';
    
    const priceValue = document.createElement('div');
    priceValue.textContent = `₨${moneyFmt.format(product.price || 0)} per cylinder`;
    priceValue.style.fontSize = '1.5rem';
    priceValue.style.fontWeight = '700';
    priceValue.style.color = 'var(--color-brand)';
    
    modalPrice.appendChild(priceLabel);
    modalPrice.appendChild(priceValue);

    // Handle stock status
    const isOutOfStock = product.inStock === false;
    if (modalBuyNow) {
      if (isOutOfStock) {
        modalBuyNow.disabled = true;
        modalBuyNow.textContent = 'Out of Stock';
        modalBuyNow.classList.add('btn--disabled');
        modalBuyNow.style.opacity = '0.6';
        modalBuyNow.style.cursor = 'not-allowed';
      } else {
        modalBuyNow.disabled = false;
        modalBuyNow.textContent = 'Buy Now';
        modalBuyNow.classList.remove('btn--disabled');
        modalBuyNow.style.opacity = '';
        modalBuyNow.style.cursor = '';
      }
    }

    // Apply grayscale to image if out of stock
    if (modalImage && isOutOfStock) {
      modalImage.style.filter = 'grayscale(100%)';
      modalImage.style.opacity = '0.6';
    } else if (modalImage) {
      modalImage.style.filter = '';
      modalImage.style.opacity = '';
    }

    // Show modal
    modal.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-desc-modal-open');

    // Focus first focusable element
    if (modalClose) {
      modalClose.focus();
    }

    // Fire analytics
    if (window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track('product_view_description', { productId });
    }
  };

  const closeDescriptionModal = () => {
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('product-desc-modal-open');

    // Restore focus
    if (lastFocusedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(lastFocusedElement);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        const target = lastFocusedElement;
        window.requestAnimationFrame(() => {
          if (target) target.focus();
        });
      }
    }
    lastFocusedElement = null;
    currentProductId = null;
  };

  const handleModalKeyDown = (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      event.preventDefault();
      closeDescriptionModal();
    }
  };

  // Modal event listeners
  if (modalClose) {
    modalClose.addEventListener('click', closeDescriptionModal);
  }
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeDescriptionModal();
      }
    });
  }
  if (modalBuyNow) {
    modalBuyNow.addEventListener('click', async () => {
      if (currentProductId && !modalBuyNow.disabled) {
        // Check stock before navigating
    const product = await fetchProduct(currentProductId);
        if (product && product.inStock === false) {
          alert('This product is currently out of stock and cannot be purchased.');
          return;
        }
        closeDescriptionModal();
        navigateToOrderPage(currentProductId);
      }
    });
  }
  document.addEventListener('keydown', handleModalKeyDown);

  // ============================================
  // ORDER PAGE
  // ============================================
  const orderPage = document.getElementById('order-page');
  const orderPageClose = document.getElementById('order-page-close');
  const orderPageForm = document.getElementById('order-page-form');
  const orderPageProductId = document.getElementById('order-page-product-id');
  const orderPageProductImg = document.getElementById('order-page-product-img');
  const orderPageProductName = document.getElementById('order-page-product-name');
  const orderPageProductPrice = document.getElementById('order-page-product-price-value');
  const orderPageCylinderType = document.getElementById('order-page-cylinder-type');
  const orderPageQuantity = document.getElementById('order-page-quantity');
  const orderPageQuantityDecrease = orderPageForm?.querySelector('.quantity-btn--decrease');
  const orderPageQuantityIncrease = orderPageForm?.querySelector('.quantity-btn--increase');
  const orderPageCoupon = document.getElementById('order-page-coupon');
  const orderPageCouponApply = document.getElementById('order-page-coupon-apply');
  const orderPageErrCoupon = document.getElementById('order-page-err-coupon');
  const orderPageSuccessCoupon = document.getElementById('order-page-success-coupon');
  const orderPageSubtotal = document.getElementById('order-page-subtotal-value');
  const orderPageTotal = document.getElementById('order-page-total-value');
  const orderPageDiscountRow = document.getElementById('order-page-discount-row');
  const orderPageDiscountLabel = document.getElementById('order-page-discount-label');
  const orderPageDiscountValue = document.getElementById('order-page-discount-value');

  // Product prices - fetched from API
  let productPrices = {
    domestic: 2500, // Default fallback
    commercial: 3000, // Default fallback
  };

  /**
   * Fetch product prices from API
   */
  async function fetchProductPrices() {
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
        console.warn('Failed to fetch product prices, using defaults');
        return;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Extract prices from products
        data.data.forEach(product => {
          if (product.category) {
            const typeLower = product.category.toLowerCase();
            if (typeLower === 'domestic' || typeLower === 'commercial') {
              productPrices[typeLower] = parseFloat(product.price) || productPrices[typeLower];
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching product prices:', error);
      // Use default prices on error
    }
  }

  // Fetch prices on page load
  fetchProductPrices();

  const formatPKR = (n) => {
    const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
    return `₨${moneyFmt.format(Math.max(0, Math.round(n)))}`;
  };

  // Coupon state
  let couponState = { status: 'idle', code: '' };

  const calculateOrderTotal = () => {
    const cylinderType = orderPageCylinderType?.value || 'domestic';
    const quantity = parseInt(orderPageQuantity?.value || '1', 10) || 1;
    const unitPrice = productPrices[cylinderType] || productPrices.domestic;
    const subtotal = unitPrice * quantity;

    // Calculate discount
    let discount = 0;
    let discountPct = 0;

    if (couponState.status === 'applied' && couponState.kind && couponState.value) {
      if (couponState.kind === 'percent') {
        discountPct = couponState.value;
        discount = Math.round((subtotal * discountPct) / 100);
      } else {
        discount = Math.min(subtotal, couponState.value);
        discountPct = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;
      }
    }

    const finalTotal = Math.max(0, subtotal - discount);

    // Update display
    if (orderPageSubtotal) {
      orderPageSubtotal.textContent = formatPKR(subtotal);
    }
    if (orderPageTotal) {
      orderPageTotal.textContent = formatPKR(finalTotal);
    }

    // Show/hide discount row and add strikethrough to subtotal
    const hasDiscount = discount > 0 && couponState.status === 'applied';
    if (orderPageDiscountRow) {
      orderPageDiscountRow.classList.toggle('is-hidden', !hasDiscount);
    }
    // Add strikethrough to subtotal when coupon is applied
    if (orderPageSubtotal) {
      orderPageSubtotal.classList.toggle('is-struck', hasDiscount);
    }
    if (hasDiscount && orderPageDiscountLabel && orderPageDiscountValue) {
      orderPageDiscountLabel.textContent = 'Discount';
      orderPageDiscountValue.textContent = `${formatPKR(discount)} (${discountPct}%)`;
    }
  };

  const applyCoupon = async () => {
    const code = orderPageCoupon?.value.trim().toUpperCase() || '';
    if (orderPageCoupon) orderPageCoupon.value = code;

    // Clear coupon state if user empties the field
    if (!code) {
      couponState = { status: 'idle', code: '' };
      if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
      if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
      if (orderPageCouponApply) {
        orderPageCouponApply.textContent = 'Apply';
        orderPageCouponApply.classList.remove('is-applied');
      }
      calculateOrderTotal();
      return;
    }

    // Calculate subtotal for validation
    const cylinderType = orderPageCylinderType?.value || 'domestic';
    const quantity = parseInt(orderPageQuantity?.value || '1', 10) || 1;
    const unitPrice = productPrices[cylinderType] || productPrices.domestic;
    const subtotal = unitPrice * quantity;
    
    // Normalize cylinder type to 'Domestic' or 'Commercial'
    const normalizedCylinderType = cylinderType === 'commercial' ? 'Commercial' : 'Domestic';

    couponState = { status: 'checking', code };
    if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
    if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
    if (orderPageCouponApply) {
      orderPageCouponApply.disabled = true;
      const prevLabel = orderPageCouponApply.textContent;
      orderPageCouponApply.textContent = 'Applying…';
    }

    try {
      // Use centralized API config if available
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('coupons') + '/validate'
        : 'http://localhost:5000/api/coupons/validate';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          subtotal: subtotal,
          cylinderType: normalizedCylinderType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const couponData = data.data;
        couponState = { 
          status: 'applied', 
          code: couponData.code,
          kind: couponData.kind, // 'percent' or 'flat'
          value: couponData.kind === 'percent' ? couponData.discountPercent : couponData.discountAmount
        };
        if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
        if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = 'Coupon Applied';
        if (orderPageCouponApply) {
          orderPageCouponApply.disabled = false;
          orderPageCouponApply.textContent = 'Applied';
          orderPageCouponApply.classList.add('is-applied');
        }
      } else {
        couponState = { status: 'invalid', code };
        if (orderPageErrCoupon) orderPageErrCoupon.textContent = data.error || 'Invalid coupon code.';
        if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
        if (orderPageCouponApply) {
          orderPageCouponApply.disabled = false;
          orderPageCouponApply.textContent = prevLabel || 'Apply';
          orderPageCouponApply.classList.remove('is-applied');
        }
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      couponState = { status: 'invalid', code };
      if (orderPageErrCoupon) orderPageErrCoupon.textContent = 'Failed to validate coupon. Please try again.';
      if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
      if (orderPageCouponApply) {
        orderPageCouponApply.disabled = false;
        orderPageCouponApply.textContent = prevLabel || 'Apply';
        orderPageCouponApply.classList.remove('is-applied');
      }
    }

    // If invalid, remove discounts from totals
    if (couponState.status !== 'applied') {
      couponState = { status: 'idle', code: couponState.code };
    }

    calculateOrderTotal();
  };

  const navigateToOrderPage = async (productId) => {
    const product = await fetchProduct(productId);
    if (!product) {
      console.error('Product not found:', productId);
      alert('Product not found. Please try again.');
      return;
    }

    // Check stock before navigating
    if (product.inStock === false) {
      alert('This product is currently out of stock and cannot be purchased. Please check back later.');
      return;
    }

    // Fire analytics
    if (window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track('product_buy_now_click', { productId, source: 'listing' });
      window.analytics.track('order_page_view', { productId });
    }

    // Update URL hash
    window.location.hash = `#order?product=${productId}`;

    // Populate order page
    if (orderPageProductId) orderPageProductId.value = productId;
    if (orderPageProductImg) {
      orderPageProductImg.src = product.image;
      orderPageProductImg.alt = product.name;
    }
    if (orderPageProductName) orderPageProductName.textContent = product.name;
    if (orderPageProductPrice) {
      const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
      orderPageProductPrice.textContent = `₨${moneyFmt.format(product.price)} per cylinder`;
    }
    if (orderPageCylinderType) {
      orderPageCylinderType.value = product.type;
    }

    // Ensure productId is set (use productId parameter or fall back to product.type)
    if (orderPageProductId && (!orderPageProductId.value || orderPageProductId.value === '')) {
      orderPageProductId.value = productId || product.type || 'domestic';
    }

    // Show order page
    if (orderPage) {
      orderPage.classList.remove('is-hidden');
      document.body.classList.add('order-page-open');
      
      // Focus first input
      const firstInput = orderPageForm?.querySelector('input, textarea, select');
      if (firstInput) {
        window.requestAnimationFrame(() => firstInput.focus());
      }
    }

    // Reset coupon state when opening order page
    couponState = { status: 'idle', code: '' };
    if (orderPageCoupon) orderPageCoupon.value = '';
    if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
    if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
    if (orderPageCouponApply) {
      orderPageCouponApply.textContent = 'Apply';
      orderPageCouponApply.classList.remove('is-applied');
    }
    if (orderPageDiscountRow) orderPageDiscountRow.classList.add('is-hidden');

    // Calculate initial total
    calculateOrderTotal();
  };

  const closeOrderPage = () => {
    if (orderPage) {
      orderPage.classList.add('is-hidden');
      document.body.classList.remove('order-page-open');
      window.location.hash = '#products';
    }
  };

  // Order page event listeners
  if (orderPageClose) {
    orderPageClose.addEventListener('click', closeOrderPage);
  }

  if (orderPageQuantityDecrease) {
    orderPageQuantityDecrease.addEventListener('click', () => {
      const current = parseInt(orderPageQuantity?.value || '1', 10);
      if (current > 1) {
        orderPageQuantity.value = String(current - 1);
        calculateOrderTotal();
      }
    });
  }

  if (orderPageQuantityIncrease) {
    orderPageQuantityIncrease.addEventListener('click', () => {
      const current = parseInt(orderPageQuantity?.value || '1', 10);
      if (current < 999) {
        orderPageQuantity.value = String(current + 1);
        calculateOrderTotal();
      }
    });
  }

  if (orderPageCylinderType) {
    orderPageCylinderType.addEventListener('change', calculateOrderTotal);
  }

  if (orderPageQuantity) {
    orderPageQuantity.addEventListener('input', calculateOrderTotal);
  }

  // Coupon apply button
  if (orderPageCouponApply) {
    orderPageCouponApply.addEventListener('click', applyCoupon);
  }

  // Coupon input Enter key
  if (orderPageCoupon) {
    orderPageCoupon.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyCoupon();
      }
    });
    
    // Reset button text when user types a new code
    orderPageCoupon.addEventListener('input', () => {
      if (orderPageCouponApply && orderPageCouponApply.classList.contains('is-applied')) {
        orderPageCouponApply.textContent = 'Apply';
        orderPageCouponApply.classList.remove('is-applied');
      }
      if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
      if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
    });
  }

  // Handle order form submission
  if (orderPageForm) {
    orderPageForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(orderPageForm);
      let productId = formData.get('productId');
      const quantity = parseInt(formData.get('quantity') || '1', 10);
      const cylinderType = formData.get('cylinderType') || 'domestic';

      // If productId is missing, use cylinderType as fallback (domestic/commercial)
      if (!productId || productId === '') {
        productId = cylinderType || 'domestic';
        // Update the hidden field so it persists
        if (orderPageProductId) {
          orderPageProductId.value = productId;
        }
      }

      const product = await fetchProduct(productId);
      if (!product) {
        alert('Product not found. Please try again.');
        return;
      }

      const cylinderTypeValue = formData.get('cylinderType') || product.type;
      const quantityValue = parseInt(formData.get('quantity') || '1', 10);
      // Use product price from API
      const unitPrice = product.price || 0;
      const subtotal = unitPrice * quantityValue;

      // Calculate discount if coupon applied
      let discount = 0;
      if (couponState.status === 'applied' && couponState.kind && couponState.value) {
        if (couponState.kind === 'percent') {
          discount = Math.round((subtotal * couponState.value) / 100);
        } else {
          discount = Math.min(subtotal, couponState.value);
        }
      }
      const finalPrice = Math.max(0, subtotal - discount);

      // Get form data
      const customerName = String(formData.get('customerName') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const address = String(formData.get('address') || '').trim();

      // Minimal validation (backend also validates)
      if (!customerName || !phone || !address) {
        alert('Please fill Name, Phone, and Address.');
        return;
      }

      // ✅ Create real order in DB so it appears in admin panel
      try {
        const apiUrl = (typeof window !== 'undefined' && window.getApiUrl)
          ? window.getApiUrl('order') // POST /api/order
          : 'http://localhost:5000/api/order';

        const normalizedCylinderType =
          String(cylinderTypeValue).toLowerCase() === 'commercial' ? 'Commercial' : 'Domestic';

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName,
            phone,
            address,
            cylinderType: normalizedCylinderType,
            quantity: quantityValue,
            couponCode: couponState.status === 'applied' ? couponState.code : undefined,
          }),
        });

        let result = null;
        try {
          result = await res.json();
        } catch (jsonErr) {
          // ignore, handled below
        }

        if (!res.ok || !result || !result.success) {
          const msg =
            (result && (result.error || result.message)) ||
            `Failed to place order (HTTP ${res.status})`;
          alert(msg);
          return;
        }

        // Privacy: store ONLY orderId locally (no order details/PII)
        try {
          const oid = result && result.data && result.data.orderId ? String(result.data.orderId) : null;
          if (oid && window.OrderStorage && typeof window.OrderStorage.addOrderId === 'function') {
            window.OrderStorage.addOrderId(oid);
          }
        } catch (_) {}

        // Add to cart using CartManager (keep existing UI behavior)
        if (window.CartManager) {
          try {
            const cartItem = {
              // Use DB orderId if available, fallback to productId
              id: (result.data && result.data.orderId) ? String(result.data.orderId) : String(productId),
              name: product.name,
              type: cylinderTypeValue,
              unitPrice: unitPrice,
              quantity: quantityValue,
              variant: 'default',
              couponCode: couponState.status === 'applied' ? couponState.code : null,
              discount: discount,
              finalPrice: finalPrice,
            };

            window.CartManager.addItem(cartItem);
          } catch (error) {
            console.error('Failed to add to cart:', error);
            // Do not block order creation; just inform user cart UI failed
            alert('Order placed, but failed to add to cart UI. Please refresh and check admin panel.');
          }
        }

        // Fire analytics
        if (window.analytics && typeof window.analytics.track === 'function') {
          window.analytics.track('cart_add', { productId, quantity: quantityValue });
          window.analytics.track('order_created', { orderId: result.data?.orderId, productId });
        }

        // Redirect to cart page
        closeOrderPage();
        if (typeof window.openCartPage === 'function') {
          window.openCartPage();
        } else if (typeof window.openSidecard === 'function') {
          window.openSidecard();
        } else {
          alert(`Order confirmed! Order ID: ${result.data?.orderId || 'N/A'}`);
        }
      } catch (error) {
        console.error('Order creation failed:', error);
        alert('Failed to place order. Please try again.');
      }
    });
  }

  // Handle hash changes for order page
  const handleHashChange = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#order')) {
      const url = new URL(hash.substring(1), window.location.origin);
      const productId = url.searchParams.get('product');
      if (isValidProductId(productId)) {
        navigateToOrderPage(productId);
      }
    } else if (orderPage && !orderPage.classList.contains('is-hidden')) {
      closeOrderPage();
    }
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      handleHashChange();
    });
  } else {
    handleHashChange();
  }

  window.addEventListener('hashchange', handleHashChange);

  // ============================================
  // PRODUCT CARD BUTTONS
  // ============================================
  const viewDescButtons = document.querySelectorAll('.product-view-desc-btn');
  viewDescButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.getAttribute('data-product-id');
      if (isValidProductId(productId)) {
        openDescriptionModal(productId);
      }
    });
  });

  // Use event delegation for dynamically loaded buy buttons
  // Run in capture phase so button-level stopPropagation() does not block this handler.
  document.addEventListener('click', async (e) => {
    const buyBtn = e.target.closest('.product-buy-now-btn');
    if (buyBtn && !buyBtn.disabled) {
      e.preventDefault();
      e.stopPropagation();
      const productId = buyBtn.getAttribute('data-product-id');
      if (isValidProductId(productId)) {
        // Check stock before navigating
        const product = await fetchProduct(productId);
        if (product && product.inStock === false) {
          alert('This product is currently out of stock and cannot be purchased.');
          return;
        }
        navigateToOrderPage(productId);
      }
    }
  }, true);

  // Prevent product card click when clicking buttons
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const buttons = card.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  });
})();

