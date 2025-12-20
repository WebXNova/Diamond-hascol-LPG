(() => {
  'use strict';

  // Wait for PRODUCTS to be available
  const getProducts = () => {
    if (typeof PRODUCTS !== 'undefined') {
      return PRODUCTS;
    }
    if (typeof window.PRODUCTS !== 'undefined') {
      return window.PRODUCTS;
    }
    return null;
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

  const openDescriptionModal = (productId) => {
    const products = getProducts();
    if (!products || !products[productId]) {
      console.error('Product not found:', productId);
      return;
    }

    const product = products[productId];
    currentProductId = productId;
    lastFocusedElement = document.activeElement;

    // Populate modal
    modalTitle.textContent = product.name;
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalDescription.textContent = product.description;

    // Clear and populate specs
    modalSpecs.innerHTML = '';
    product.specs.forEach(spec => {
      const li = document.createElement('li');
      li.textContent = spec;
      modalSpecs.appendChild(li);
    });

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

  const PRICES = {
    domestic: 3200,
    commercial: 12800,
  };

  const formatPKR = (n) => {
    const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
    return `₨${moneyFmt.format(Math.max(0, Math.round(n)))}`;
  };

  // Coupon state
  let couponState = { status: 'idle', code: '' };

  const calculateOrderTotal = () => {
    const cylinderType = orderPageCylinderType?.value || 'domestic';
    const quantity = parseInt(orderPageQuantity?.value || '1', 10) || 1;
    const unitPrice = PRICES[cylinderType] || PRICES.domestic;
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

    couponState = { status: 'checking', code };
    if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
    if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = '';
    if (orderPageCouponApply) {
      orderPageCouponApply.disabled = true;
      const prevLabel = orderPageCouponApply.textContent;
      orderPageCouponApply.textContent = 'Applying…';

      const delay = 500 + Math.floor(Math.random() * 201); // 500–700ms
      window.setTimeout(() => {
        if (code === 'WELCOME10') {
          couponState = { status: 'applied', code, kind: 'percent', value: 10 };
          if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
          if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = 'Coupon Applied';
          if (orderPageCouponApply) {
            orderPageCouponApply.disabled = false;
            orderPageCouponApply.textContent = 'Applied';
            orderPageCouponApply.classList.add('is-applied');
          }
        } else if (code === 'FLAT500') {
          couponState = { status: 'applied', code, kind: 'flat', value: 500 };
          if (orderPageErrCoupon) orderPageErrCoupon.textContent = '';
          if (orderPageSuccessCoupon) orderPageSuccessCoupon.textContent = 'Coupon Applied';
          if (orderPageCouponApply) {
            orderPageCouponApply.disabled = false;
            orderPageCouponApply.textContent = 'Applied';
            orderPageCouponApply.classList.add('is-applied');
          }
        } else {
          couponState = { status: 'invalid', code };
          if (orderPageErrCoupon) orderPageErrCoupon.textContent = 'Invalid coupon code.';
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
      }, delay);
    }
  };

  const navigateToOrderPage = (productId) => {
    const products = getProducts();
    if (!products || !products[productId]) {
      console.error('Product not found:', productId);
      return;
    }

    const product = products[productId];

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

      const products = getProducts();
      if (!products || !products[productId]) {
        alert('Product not found. Please try again.');
        return;
      }

      const product = products[productId];
      const cylinderTypeValue = formData.get('cylinderType') || product.type;
      const quantityValue = parseInt(formData.get('quantity') || '1', 10);
      const unitPrice = PRICES[cylinderTypeValue] || PRICES.domestic;
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
      const customerName = formData.get('customerName') || '';
      const phone = formData.get('phone') || '';
      const address = formData.get('address') || '';

      // Add to cart using CartManager
      if (window.CartManager) {
        try {
          const cartItem = {
            id: productId,
            name: product.name,
            type: cylinderTypeValue,
            unitPrice: unitPrice,
            quantity: quantityValue,
            variant: 'default',
            couponCode: couponState.status === 'applied' ? couponState.code : null,
            discount: discount,
            finalPrice: finalPrice
          };

          window.CartManager.addItem(cartItem);

          // Save order to localStorage
          if (window.OrderStorage) {
            window.OrderStorage.saveOrder({
              productId: productId,
              productName: product.name,
              cylinderType: cylinderTypeValue,
              quantity: quantityValue,
              unitPrice: unitPrice,
              subtotal: subtotal,
              discount: discount,
              finalPrice: finalPrice,
              couponCode: couponState.status === 'applied' ? couponState.code : null,
              customerName: customerName,
              phone: phone,
              address: address
            });
          }

          // Fire analytics
          if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('cart_add', { productId, quantity: quantityValue });
          }

          // Redirect to cart page
          closeOrderPage();
          if (typeof window.openCartPage === 'function') {
            window.openCartPage();
          } else if (typeof window.openSidecard === 'function') {
            window.openSidecard();
          } else {
            // Fallback: show success message
            alert(`Order saved! ${quantityValue} x ${product.name} added.`);
          }
        } catch (error) {
          console.error('Failed to add to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        }
      } else {
        alert('Cart system is not available. Please try again.');
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

