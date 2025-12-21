(() => {
  'use strict';

  // Fetch product from API
  const fetchProduct = async (productId) => {
    try {
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('products') 
        : 'http://localhost:5000/api/products';
      
      const response = await fetch(`${apiUrl}/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch product:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.error('Invalid product response:', result);
        return null;
      }

      // Transform backend product to match frontend format
      const product = result.data;
      
      // Map category to type for backward compatibility
      const type = product.category?.toLowerCase() || 'domestic';
      
      // Default specs based on category
      const defaultSpecs = {
        'domestic': [
          'Standard 45kg capacity - ideal for household use',
          'ISI certified and safety tested - meets all quality standards',
          'Long-lasting and efficient - optimized fuel consumption',
          'Easy to handle and store - compact design for home storage',
          'Compatible with standard regulators - universal compatibility',
          'Durable construction - built to last for years',
          'Safety valve included - ensures safe operation'
        ],
        'commercial': [
          'High-capacity design for commercial use - meets business demands',
          'ISI certified and safety tested - professional grade quality',
          'Durable construction for heavy usage - built for commercial operations',
          'Suitable for restaurants and hotels - perfect for food service industry',
          'Professional grade quality - reliable performance',
          'Enhanced safety features - meets commercial safety standards',
          'Long service life - cost-effective for business operations'
        ]
      };
      
      return {
        id: product.id,
        name: product.name,
        type: type,
        category: product.category,
        price: product.price,
        image: product.imageUrl || '',
        description: product.description || '',
        specs: defaultSpecs[type] || defaultSpecs['domestic']
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
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
    const product = await fetchProduct(productId);
    if (!product) {
      console.error('Product not found:', productId);
      alert('Product not found. Please try again.');
      return;
    }

    currentProductId = productId;
    lastFocusedElement = document.activeElement;

    // Populate modal
    modalTitle.textContent = product.name;
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalDescription.textContent = product.description;

    // Clear and populate specs
    modalSpecs.innerHTML = '';
    if (product.specs && Array.isArray(product.specs)) {
      product.specs.forEach(spec => {
        const li = document.createElement('li');
        li.textContent = spec;
        modalSpecs.appendChild(li);
      });
    }

    // Format price
    const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
    modalPrice.textContent = `₨${moneyFmt.format(product.price)} per cylinder`;

    // Show modal
    modal.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-desc-modal-open');

    // Focus first focusable element
    modalClose.focus();

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
        window.requestAnimationFrame(() => {
          lastFocusedElement.focus();
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
    modalBuyNow.addEventListener('click', () => {
      if (currentProductId) {
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
      const productId = formData.get('productId');
      const quantity = parseInt(formData.get('quantity') || '1', 10);
      const cylinderType = formData.get('cylinderType') || 'domestic';

      if (!productId) {
        alert('Product ID is missing. Please try again.');
        return;
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
      if (productId) {
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
      if (productId) {
        openDescriptionModal(productId);
      }
    });
  });

  const buyNowButtons = document.querySelectorAll('.product-buy-now-btn');
  buyNowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.getAttribute('data-product-id');
      if (productId) {
        navigateToOrderPage(productId);
      }
    });
  });

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

