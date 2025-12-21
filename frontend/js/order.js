(() => {
  'use strict';

  const layer = document.getElementById('order-panel-layer');
  const dialog = document.getElementById('order-panel-dialog');
  const backdrop = layer ? layer.querySelector('[data-order-panel-backdrop]') : null;

  if (!layer || !dialog || !backdrop) return;

  // Existing "Order LPG Cylinder" control in Home section (do not modify its markup).
  const trigger = document.querySelector('#home .hero-buttons a.btn.btn-primary');
  if (!trigger) return;

  /** @type {HTMLElement|null} */
  let lastFocused = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const isOpen = () => layer.classList.contains('is-open');

  const getFocusableEls = () => {
    if (!dialog) return [];
    try {
      const nodes = Array.from(dialog.querySelectorAll(focusableSelector));
      return nodes.filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (el.hasAttribute('disabled')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        const style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none';
      });
    } catch (e) {
      console.warn('Error getting focusable elements:', e);
      return [];
    }
  };

  const trapTabKey = (event) => {
    if (event.key !== 'Tab') return;

    const focusables = getFocusableEls();
    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === dialog) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onKeyDown = (event) => {
    if (!isOpen()) return;
    if (!(event.target instanceof Node) || !dialog.contains(event.target)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
      return;
    }
    trapTabKey(event);
  };

  const openPanel = () => {
    if (isOpen()) return;

    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('order-panel-open');

    document.addEventListener('keydown', onKeyDown, true);

    // Focus dialog container to establish focus-trap baseline (content has no interactive elements yet).
    dialog.focus();
  };

  const closePanel = () => {
    if (!isOpen()) return;

    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('order-panel-open');

    document.removeEventListener('keydown', onKeyDown, true);

    const toFocus = lastFocused || trigger;
    lastFocused = null;
    if (toFocus instanceof HTMLElement) {
      // Restore focus after transition paint to avoid jank on some browsers.
      window.requestAnimationFrame(() => toFocus.focus());
    }
  };

  // Hero button now navigates to #products, so don't open panel
  // Panel can still be opened programmatically via window.openOrderPanel()

  backdrop.addEventListener('click', () => {
    closePanel();
  });

  // Expose openPanel globally for checkout integration
  window.openOrderPanel = openPanel;
})();

// Order form (client-side only). Does not modify modal open/close/animation behavior.
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const form = document.getElementById('order-cylinder-form');
  if (!form) return;

  const nameEl = /** @type {HTMLInputElement|null} */ (document.getElementById('order-name'));
  const phoneEl = /** @type {HTMLInputElement|null} */ (document.getElementById('order-phone'));
  const addressEl = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('order-address'));
  const qtyEl = /** @type {HTMLInputElement|null} */ (document.getElementById('order-qty'));
  const qtyWarnEl = document.getElementById('order-qty-warn');

  const errNameEl = document.getElementById('order-err-name');
  const errPhoneEl = document.getElementById('order-err-phone');
  const errAddressEl = document.getElementById('order-err-address');
  const errQtyEl = document.getElementById('order-err-qty');
  const errTypeEl = document.getElementById('order-err-type');
  const errCouponEl = document.getElementById('order-err-coupon');

  const couponEl = /** @type {HTMLInputElement|null} */ (document.getElementById('order-coupon'));
  const couponApplyBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-coupon-apply'));
  const submitBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-submit-btn'));
  const submitErrEl = document.getElementById('order-submit-error');

  const unitPriceEl = document.getElementById('order-unit-price');
  const qtyDisplayEl = document.getElementById('order-qty-display');
  const totalEl = document.getElementById('order-total');
  const discountRowEl = document.getElementById('order-discount-row');
  const discountLabelEl = document.getElementById('order-discount-label');
  const discountValueEl = document.getElementById('order-discount-value');
  const finalRowEl = document.getElementById('order-final-row');
  const finalTotalEl = document.getElementById('order-final-total');
  const priceMotionEl = document.getElementById('order-price-motion');

  const typeCards = (() => {
    try {
      const nodes = document.querySelectorAll('[data-cylinder-card]');
      return nodes ? Array.from(nodes) : [];
    } catch (e) {
      console.warn('Error querying type cards:', e);
      return [];
    }
  })();
  const typeRadios = (() => {
    try {
      const nodes = form.querySelectorAll('input[name="cylinderType"]');
      return nodes ? Array.from(nodes) : [];
    } catch (e) {
      console.warn('Error querying type radios:', e);
      return [];
    }
  })();

  if (
    !nameEl ||
    !phoneEl ||
    !addressEl ||
    !qtyEl ||
    !couponEl ||
    !couponApplyBtn ||
    !submitBtn ||
    !submitErrEl ||
    !unitPriceEl ||
    !qtyDisplayEl ||
    !totalEl ||
    !discountRowEl ||
    !discountLabelEl ||
    !discountValueEl ||
    !finalRowEl ||
    !finalTotalEl ||
    !priceMotionEl ||
    !qtyWarnEl ||
    !errNameEl ||
    !errPhoneEl ||
    !errAddressEl ||
    !errQtyEl ||
    !errTypeEl ||
    !errCouponEl
  ) {
    return;
  }

  // Toast + sidecard UI (outside modal mechanics; only UI state)
  const toastEl = document.getElementById('order-toast');
  const toastTextEl = document.getElementById('order-toast-text');
  const toastCtaBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-toast-cta'));
  const toastCloseBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-toast-close'));

  const sidecardLayerEl = document.getElementById('order-sidecard-layer');
  const sidecardBackdropEl = sidecardLayerEl ? sidecardLayerEl.querySelector('[data-order-sidecard-backdrop]') : null;
  const navCartBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nav-cart-btn'));
  const navCartDot = document.getElementById('nav-cart-dot');

  const sidecardEl = document.getElementById('order-sidecard');
  const sidecardCloseBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-sidecard-close'));
  const sidecardToggleBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-sidecard-toggle'));
  const miniCartBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-mini-cart'));

  const orderStatusBadgeEl = document.getElementById('order-status-badge');
  const orderIdEl = document.getElementById('order-id');
  const orderCreatedAtEl = document.getElementById('order-created-at');
  const orderEtaEl = document.getElementById('order-eta');
  const orderCylinderEl = document.getElementById('order-cylinder');
  const orderQtyEl = document.getElementById('order-quantity');
  const orderCouponUsedEl = document.getElementById('order-coupon-used');
  const bdUnitEl = document.getElementById('order-breakdown-unit');
  const bdSubtotalEl = document.getElementById('order-breakdown-subtotal');
  const bdDiscountRowEl = document.getElementById('order-breakdown-discount-row');
  const bdDiscountLabelEl = document.getElementById('order-breakdown-discount-label');
  const bdDiscountEl = document.getElementById('order-breakdown-discount');
  const bdTotalEl = document.getElementById('order-breakdown-total');
  const proceedCheckoutBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-proceed-checkout-btn'));
  const retryBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('order-retry-btn'));
  const sidecardErrEl = document.getElementById('order-sidecard-error');

  const hasSidecardUI =
    toastEl &&
    toastTextEl &&
    toastCtaBtn &&
    toastCloseBtn &&
    sidecardLayerEl &&
    sidecardBackdropEl &&
    navCartBtn &&
    navCartDot &&
    sidecardEl &&
    sidecardCloseBtn &&
    sidecardToggleBtn &&
    miniCartBtn &&
    orderStatusBadgeEl &&
    orderIdEl &&
    orderCreatedAtEl &&
    orderEtaEl &&
    orderCylinderEl &&
    orderQtyEl &&
    orderCouponUsedEl &&
    bdUnitEl &&
    bdSubtotalEl &&
    bdDiscountRowEl &&
    bdDiscountLabelEl &&
    bdDiscountEl &&
    bdTotalEl &&
    proceedCheckoutBtn &&
    retryBtn &&
    sidecardErrEl;

  const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
  const formatPKR = (n) => `₨${moneyFmt.format(Math.max(0, Math.round(n)))}`;

  const clampInt = (n, min, max) => {
    const x = Number.isFinite(n) ? Math.trunc(n) : min;
    return Math.min(max, Math.max(min, x));
  };

  const sanitizePhone = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^\d]/g, '');
    return hasPlus ? `+${digits}` : digits;
  };

  const capitalizeWords = (raw) =>
    raw
      .trim()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');

  /** @type {{ status: 'idle'|'applied', code: string }} */
  let couponState = { status: 'idle', code: '' };

  /** @type {{ status: 'idle'|'submitting'|'success'|'error', lastPayload: any|null, lastOrder: any|null, lastSnapshot: any|null }} */
  let submitState = { status: 'idle', lastPayload: null, lastOrder: null, lastSnapshot: null };

  /** @type {number[]} */
  let statusTimers = [];

  /** @type {HTMLElement|null} */
  let lastFocusedBeforeCard = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const getFocusableEls = (rootEl) => {
    if (!rootEl) return [];
    try {
      const nodes = Array.from(rootEl.querySelectorAll(focusableSelector));
      return nodes.filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (el.hasAttribute('disabled')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        const style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none';
      });
    } catch (e) {
      console.warn('Error getting focusable elements:', e);
      return [];
    }
  };

  const setCartIndicator = (active) => {
    if (!hasSidecardUI) return;
    // Update both desktop nav cart dot and mobile mini-cart dot
    if (navCartDot) navCartDot.classList.toggle('is-active', !!active);
    const miniCartDot = miniCartBtn ? miniCartBtn.querySelector('.order-mini-cart__dot') : null;
    if (miniCartDot) miniCartDot.classList.toggle('is-active', !!active);
    
    // Show/hide mini cart button on mobile based on active indicator
    if (miniCartBtn) {
      if (active) {
        miniCartBtn.classList.remove('is-hidden');
      } else {
        miniCartBtn.classList.add('is-hidden');
      }
    }
  };

  const getSelectedType = () => {
    const checked = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="cylinderType"]:checked'));
    return checked ? checked.value : '';
  };

  const getQty = () => {
    const parsed = Number(qtyEl.value);
    if (!Number.isFinite(parsed)) return 1;
    return clampInt(parsed, 1, 999);
  };

  const setError = (controlEl, errorEl, message) => {
    if (message) {
      controlEl.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
    } else {
      controlEl.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  };

  const setPlainError = (errorEl, message) => {
    errorEl.textContent = message || '';
  };

  const updateTypeCardsA11y = () => {
    const selected = getSelectedType();
    typeCards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      const val = card.getAttribute('data-cylinder-card') || '';
      const isSelected = val === selected;
      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  };

  // Price calculations removed - backend handles all pricing
  // This function is kept for UI display purposes only (shows placeholders)
  const computeTotals = () => {
    const type = getSelectedType();
    const qty = getQty();
    // Prices are calculated on backend - show placeholders in UI
    return { 
      type, 
      qty, 
      unit: 0, // Will be calculated on backend
      subtotal: 0, // Will be calculated on backend
      discount: 0, // Will be calculated on backend
      discountPct: 0, // Will be calculated on backend
      finalTotal: 0 // Will be calculated on backend
    };
  };

  const animatePrice = (cb) => {
    priceMotionEl.classList.add('is-enter');
    window.requestAnimationFrame(() => {
      cb();
      window.requestAnimationFrame(() => priceMotionEl.classList.remove('is-enter'));
    });
  };

  const renderPrice = () => {
    const t = computeTotals();
    animatePrice(() => {
      // Prices calculated on backend - show quantity only
      unitPriceEl.textContent = '—'; // Price fetched from backend
      qtyDisplayEl.textContent = String(t.qty);
      totalEl.textContent = '—'; // Calculated on backend

      // Hide discount row (calculated on backend)
      discountRowEl.classList.add('is-hidden');
      finalRowEl.classList.add('is-hidden');
    });
  };

  const setControlsDisabled = (disabled) => {
    const controls = Array.from(form.querySelectorAll('input, textarea, select, button'));
    controls.forEach((el) => {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el instanceof HTMLButtonElement))
        return;
      // Keep side effects minimal: only disable controls in the form.
      el.disabled = disabled;
    });
  };

  const setSubmitUI = (state, message) => {
    submitBtn.classList.toggle('is-loading', state === 'loading');
    submitBtn.disabled = state === 'loading' || submitState.status === 'success';
    submitErrEl.textContent = message || '';
  };

  const hideToast = () => {
    if (!hasSidecardUI) return;
    toastEl.classList.remove('is-open');
    window.setTimeout(() => toastEl.classList.add('is-hidden'), 220);
  };

  const showToast = (text, ctaLabel, onCta) => {
    if (!hasSidecardUI) return;
    toastTextEl.textContent = text;
    toastCtaBtn.textContent = ctaLabel;

    toastCtaBtn.onclick = () => {
      hideToast();
      onCta();
    };

    toastEl.classList.remove('is-hidden');
    window.requestAnimationFrame(() => toastEl.classList.add('is-open'));
  };

  const updateSidecardFromCart = () => {
    if (!hasSidecardUI) return;
    
    // Check if there's a submitted order (priority)
    if (submitState.lastOrder && submitState.status === 'success' && submitState.lastSnapshot) {
      renderOrderCard(submitState.lastOrder, submitState.lastSnapshot);
      return;
    }

    // Otherwise, show cart items from CartManager
    if (window.CartManager && typeof window.CartManager.getCart === 'function') {
      const cart = window.CartManager.getCart();
      // Defensive check: ensure cart and cart.items exist and is an array
      if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
        // Aggregate cart items for display
        const totalQty = cart.totalItems || 0;
        const subtotal = cart.subtotal || 0;
        const firstItem = cart.items[0];
        
        // Update sidecard display
        if (orderIdEl) orderIdEl.textContent = 'Cart Items';
        if (orderCreatedAtEl) orderCreatedAtEl.textContent = new Date().toLocaleString();
        if (orderEtaEl) orderEtaEl.textContent = '+24 hours';
        
        const typeLabel = firstItem && firstItem.type === 'commercial' ? 'Commercial' : 'Domestic';
        if (cart.items.length > 1) {
          if (orderCylinderEl) orderCylinderEl.textContent = `${typeLabel} + ${cart.items.length - 1} more`;
        } else {
          if (orderCylinderEl) orderCylinderEl.textContent = typeLabel;
        }
        if (orderQtyEl) orderQtyEl.textContent = String(totalQty);
        if (orderCouponUsedEl) orderCouponUsedEl.textContent = 'No coupon';

        if (bdUnitEl && firstItem) bdUnitEl.textContent = formatPKR(firstItem.unitPrice || 0);
        if (bdSubtotalEl) bdSubtotalEl.textContent = formatPKR(subtotal);
        if (bdDiscountRowEl) bdDiscountRowEl.classList.add('is-hidden');
        if (bdTotalEl) bdTotalEl.textContent = formatPKR(subtotal);

        // Hide status badge for cart items
        if (orderStatusBadgeEl) {
          orderStatusBadgeEl.textContent = 'Cart';
          orderStatusBadgeEl.classList.remove(
            'order-sidecard__badge--confirmed',
            'order-sidecard__badge--preparing',
            'order-sidecard__badge--out_for_delivery',
            'order-sidecard__badge--delivered'
          );
        }

        // Enable checkout button
        if (proceedCheckoutBtn) {
          proceedCheckoutBtn.disabled = false;
        }
      } else {
        // Empty cart - show empty state
        if (orderIdEl) orderIdEl.textContent = '—';
        if (orderCreatedAtEl) orderCreatedAtEl.textContent = '—';
        if (orderCylinderEl) orderCylinderEl.textContent = '—';
        if (orderQtyEl) orderQtyEl.textContent = '—';
        if (bdUnitEl) bdUnitEl.textContent = '—';
        if (bdSubtotalEl) bdSubtotalEl.textContent = '—';
        if (bdTotalEl) bdTotalEl.textContent = '—';
        if (proceedCheckoutBtn) {
          proceedCheckoutBtn.disabled = true;
        }
      }
    }
  };

  const openSidecard = () => {
    if (!hasSidecardUI) return;
    if (sidecardLayerEl.classList.contains('is-open')) return;
    lastFocusedBeforeCard = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sidecardLayerEl.classList.add('is-open');
    sidecardLayerEl.setAttribute('aria-hidden', 'false');
    sidecardEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('order-sidecard-open');
    miniCartBtn.classList.remove('is-hidden');
    
    // Update sidecard with cart items if available
    updateSidecardFromCart();
    
    const focusables = getFocusableEls(sidecardEl);
    (focusables[0] || sidecardEl).focus();
  };

  const closeSidecard = () => {
    if (!hasSidecardUI) return;
    sidecardLayerEl.classList.remove('is-open');
    sidecardLayerEl.setAttribute('aria-hidden', 'true');
    sidecardEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('order-sidecard-open');
    sidecardErrEl.classList.add('is-hidden');
    sidecardErrEl.textContent = '';
    retryBtn.classList.add('is-hidden');

    // On mobile, prefer mini-cart button; on desktop, prefer nav cart button
    const isMobile = window.innerWidth <= 768;
    const fallbackBtn = isMobile ? miniCartBtn : navCartBtn;
    const toFocus = lastFocusedBeforeCard || fallbackBtn;
    lastFocusedBeforeCard = null;
    if (toFocus instanceof HTMLElement) {
      // Only restore focus if element is visible and focusable
      const style = window.getComputedStyle(toFocus);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        window.requestAnimationFrame(() => toFocus.focus());
      }
    }
  };

  const clearStatusTimers = () => {
    statusTimers.forEach((id) => window.clearTimeout(id));
    statusTimers = [];
  };

  // Checkout screen UI
  const checkoutLayerEl = document.getElementById('checkout-layer');
  const checkoutDialogEl = document.getElementById('checkout-dialog');
  const checkoutBackdropEl = checkoutLayerEl ? checkoutLayerEl.querySelector('[data-checkout-backdrop]') : null;
  const checkoutCloseBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('checkout-close'));
  const checkoutOrderIdEl = document.getElementById('checkout-order-id');
  const checkoutStatusEl = document.getElementById('checkout-status');
  const checkoutCreatedAtEl = document.getElementById('checkout-created-at');
  const checkoutEtaEl = document.getElementById('checkout-eta');
  const checkoutItemNameEl = document.getElementById('checkout-item-name');
  const checkoutItemQtyEl = document.getElementById('checkout-item-qty');
  const checkoutItemPriceEl = document.getElementById('checkout-item-price');
  const checkoutUnitPriceEl = document.getElementById('checkout-unit-price');
  const checkoutQuantityEl = document.getElementById('checkout-quantity');
  const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
  const checkoutDiscountRowEl = document.getElementById('checkout-discount-row');
  const checkoutDiscountLabelEl = document.getElementById('checkout-discount-label');
  const checkoutDiscountEl = document.getElementById('checkout-discount');
  const checkoutGrandTotalEl = document.getElementById('checkout-grand-total');
  const checkoutCouponEl = document.getElementById('checkout-coupon');
  const checkoutPlaceOrderBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('checkout-place-order-btn'));

  const hasCheckoutUI =
    checkoutLayerEl &&
    checkoutDialogEl &&
    checkoutBackdropEl &&
    checkoutCloseBtn &&
    checkoutOrderIdEl &&
    checkoutStatusEl &&
    checkoutCreatedAtEl &&
    checkoutEtaEl &&
    checkoutItemNameEl &&
    checkoutItemQtyEl &&
    checkoutItemPriceEl &&
    checkoutUnitPriceEl &&
    checkoutQuantityEl &&
    checkoutSubtotalEl &&
    checkoutDiscountRowEl &&
    checkoutDiscountLabelEl &&
    checkoutDiscountEl &&
    checkoutGrandTotalEl &&
    checkoutCouponEl &&
    checkoutPlaceOrderBtn;

  /** @type {HTMLElement|null} */
  let lastFocusedBeforeCheckout = null;

  const openCheckout = () => {
    if (!hasCheckoutUI) return;
    
    // Check if there's a submitted order to show checkout screen
    if (submitState.lastOrder && submitState.status === 'success' && submitState.lastSnapshot) {
      renderCheckout(submitState.lastOrder, submitState.lastSnapshot);
      lastFocusedBeforeCheckout = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      checkoutLayerEl.classList.add('is-open');
      checkoutLayerEl.setAttribute('aria-hidden', 'false');
      document.body.classList.add('checkout-open');
      const focusables = getFocusableEls(checkoutDialogEl);
      (focusables[0] || checkoutDialogEl).focus();
      return;
    }

    // If no submitted order but cart has items, open the order form panel
    if (window.CartManager && typeof window.CartManager.getCart === 'function') {
      const cart = window.CartManager.getCart();
      // Defensive check: ensure cart and cart.items exist and is an array
      if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
        // Close sidecard and open order form panel
        closeSidecard();
        if (typeof window.openOrderPanel === 'function') {
          window.openOrderPanel();
        } else {
          // Fallback: trigger the order button click
          const orderPanelTrigger = document.querySelector('#home .hero-buttons a.btn.btn-primary');
          if (orderPanelTrigger) {
            orderPanelTrigger.click();
          }
        }
        return;
      }
    }

    // No order and no cart items - keep cart open
    return;
  };

  const closeCheckout = () => {
    if (!hasCheckoutUI) return;
    checkoutLayerEl.classList.remove('is-open');
    checkoutLayerEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('checkout-open');

    const toFocus = lastFocusedBeforeCheckout || proceedCheckoutBtn;
    lastFocusedBeforeCheckout = null;
    if (toFocus instanceof HTMLElement) {
      const style = window.getComputedStyle(toFocus);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        window.requestAnimationFrame(() => toFocus.focus());
      }
    }
  };

  const renderCheckout = (order, snapshot) => {
    if (!hasCheckoutUI) return;

    checkoutOrderIdEl.textContent = order.orderId || 'N/A';
    checkoutStatusEl.textContent = order.status 
      ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
      : 'Unknown';
    checkoutCreatedAtEl.textContent = order.createdAt 
      ? new Date(order.createdAt).toLocaleString() 
      : new Date().toLocaleString();
    // ETA is not provided by backend, use default
    checkoutEtaEl.textContent = order.estimatedDelivery || '+24 hours';

    const typeLabel = snapshot.type === 'commercial' ? 'Commercial LPG Cylinder' : 'Domestic LPG Cylinder';
    checkoutItemNameEl.textContent = typeLabel;
    checkoutItemQtyEl.textContent = `Quantity: ${snapshot.qty}`;
    checkoutItemPriceEl.textContent = formatPKR(snapshot.unit);

    checkoutUnitPriceEl.textContent = formatPKR(snapshot.unit);
    checkoutQuantityEl.textContent = String(snapshot.qty);
    checkoutSubtotalEl.textContent = formatPKR(snapshot.subtotal);

    const hasDiscount = snapshot.discount > 0;
    checkoutDiscountRowEl.classList.toggle('is-hidden', !hasDiscount);
    if (hasDiscount) {
      checkoutDiscountLabelEl.textContent = 'Discount';
      checkoutDiscountEl.textContent = `${formatPKR(snapshot.discount)} (${snapshot.discountPct}%)`;
    }

    checkoutGrandTotalEl.textContent = formatPKR(snapshot.finalTotal);
    checkoutCouponEl.textContent = snapshot.couponCode || 'No coupon';

    checkoutPlaceOrderBtn.disabled = false;
  };

  const setStatus = (status) => {
    if (!hasSidecardUI) return;
    const labelMap = {
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
    };

    orderStatusBadgeEl.textContent = labelMap[status] || 'Confirmed';
    orderStatusBadgeEl.classList.remove(
      'order-sidecard__badge--confirmed',
      'order-sidecard__badge--preparing',
      'order-sidecard__badge--out_for_delivery',
      'order-sidecard__badge--delivered',
    );
    if (status === 'preparing') orderStatusBadgeEl.classList.add('order-sidecard__badge--preparing');
    else if (status === 'out_for_delivery') orderStatusBadgeEl.classList.add('order-sidecard__badge--out_for_delivery');
    else if (status === 'delivered') orderStatusBadgeEl.classList.add('order-sidecard__badge--delivered');
    else orderStatusBadgeEl.classList.add('order-sidecard__badge--confirmed');
  };

  const startStatusSimulation = () => {
    clearStatusTimers();
    // A few seconds between each state.
    statusTimers.push(window.setTimeout(() => setStatus('preparing'), 3000));
    statusTimers.push(window.setTimeout(() => setStatus('out_for_delivery'), 8000));
    statusTimers.push(window.setTimeout(() => setStatus('delivered'), 14000));
  };

  const renderOrderCard = (order, snapshot) => {
    if (!hasSidecardUI) return;
    orderIdEl.textContent = order.orderId || 'N/A';
    orderCreatedAtEl.textContent = order.createdAt 
      ? new Date(order.createdAt).toLocaleString() 
      : new Date().toLocaleString();
    // ETA is not provided by backend, use default
    orderEtaEl.textContent = order.estimatedDelivery || '+24 hours';

    const typeLabel = snapshot.type === 'commercial' ? 'Commercial' : 'Domestic';
    orderCylinderEl.textContent = typeLabel;
    orderQtyEl.textContent = String(snapshot.qty);

    orderCouponUsedEl.textContent = snapshot.couponCode ? snapshot.couponCode : 'No coupon';

    bdUnitEl.textContent = formatPKR(snapshot.unit);
    bdSubtotalEl.textContent = formatPKR(snapshot.subtotal);

    const hasDiscount = snapshot.discount > 0;
    bdDiscountRowEl.classList.toggle('is-hidden', !hasDiscount);
    if (hasDiscount) {
      bdDiscountLabelEl.textContent = 'Discount';
      bdDiscountEl.textContent = `${formatPKR(snapshot.discount)} (${snapshot.discountPct}%)`;
    }
    bdTotalEl.textContent = formatPKR(snapshot.finalTotal);

    retryBtn.classList.add('is-hidden');
    sidecardErrEl.classList.add('is-hidden');
    sidecardErrEl.textContent = '';

    // Enable checkout button when order exists
    if (proceedCheckoutBtn) {
      proceedCheckoutBtn.disabled = false;
    }

    setStatus(order.status || 'pending');
  };

  const renderQtyWarning = () => {
    const qty = getQty();
    qtyWarnEl.textContent = qty > 100 ? `You selected ${qty} cylinders — proceed?` : '';
  };

  const validate = () => {
    const errors = [];

    const name = nameEl.value.trim();
    if (!name) errors.push({ el: nameEl, err: errNameEl, msg: 'Customer name is required.' });

    const phone = sanitizePhone(phoneEl.value);
    phoneEl.value = phone;
    const phoneStr = phone || '';
    const digitsCount = phoneStr.replace(/[^\d]/g, '').length;
    if (!phone) errors.push({ el: phoneEl, err: errPhoneEl, msg: 'Phone number is required.' });
    else if (!/^\+?\d+$/.test(phone)) errors.push({ el: phoneEl, err: errPhoneEl, msg: 'Use numbers only (optional "+" at start).' });
    else if (digitsCount < 7) errors.push({ el: phoneEl, err: errPhoneEl, msg: 'Phone number looks too short.' });

    const address = addressEl.value.trim();
    if (!address) errors.push({ el: addressEl, err: errAddressEl, msg: 'Exact address is required.' });

    const type = getSelectedType();
    if (!type) setPlainError(errTypeEl, 'Please select a cylinder type.');
    else setPlainError(errTypeEl, '');

    const qtyRaw = qtyEl.value;
    const qtyNum = Number(qtyRaw);
    const qty = getQty();
    if (!qtyRaw) errors.push({ el: qtyEl, err: errQtyEl, msg: 'Quantity is required.' });
    else if (!Number.isFinite(qtyNum)) errors.push({ el: qtyEl, err: errQtyEl, msg: 'Quantity must be a number.' });
    else if (!Number.isInteger(qtyNum)) errors.push({ el: qtyEl, err: errQtyEl, msg: 'Quantity must be a whole number.' });
    else if (qty < 1) errors.push({ el: qtyEl, err: errQtyEl, msg: 'Quantity must be at least 1.' });
    else if (qty > 999) errors.push({ el: qtyEl, err: errQtyEl, msg: 'Quantity cannot exceed 999.' });

    // Apply errors
    setError(nameEl, errNameEl, '');
    setError(phoneEl, errPhoneEl, '');
    setError(addressEl, errAddressEl, '');
    setError(qtyEl, errQtyEl, '');

    errors.forEach(({ el, err, msg }) => setError(el, err, msg));

    return errors;
  };

  // Coupon validation via API
  const applyCoupon = async () => {
    const code = couponEl.value.trim().toUpperCase();
    couponEl.value = code;

    // Clear coupon state if user empties the field
    if (!code) {
      couponState = { status: 'idle', code: '' };
      setPlainError(errCouponEl, '');
      renderPrice();
      return;
    }

    // Get selected type and quantity for validation
    const selectedType = getSelectedType();
    const qty = getQty();
    
    if (!selectedType) {
      setPlainError(errCouponEl, 'Please select a cylinder type first.');
      return;
    }

    // Fetch product price from API based on cylinder type
    try {
      couponState = { status: 'checking', code };
      setPlainError(errCouponEl, '');
      
      // Normalize cylinder type to match backend format ('Domestic' or 'Commercial')
      const normalizedType = selectedType.charAt(0).toUpperCase() + selectedType.slice(1).toLowerCase();
      const cylinderTypeForApi = normalizedType === 'Commercial' ? 'Commercial' : 'Domestic';
      
      // Fetch product to get price
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('products') 
        : 'http://localhost:5000/api/products';
      
      // Try to get product by type (assuming products can be queried by type)
      // For now, we'll fetch all products and find the matching one
      const productsResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!productsResponse.ok) {
        throw new Error('Failed to fetch product prices');
      }

      const productsData = await productsResponse.json();
      if (!productsData.success || !Array.isArray(productsData.data)) {
        throw new Error('Invalid products data');
      }

      // Find product matching the selected type
      const product = productsData.data.find(p => 
        p.type && p.type.toLowerCase() === cylinderTypeForApi.toLowerCase() && p.isActive
      );

      if (!product) {
        throw new Error('Product not found for selected type');
      }

      const subtotal = parseFloat(product.price) * qty;

      // Validate coupon with API
      const couponApiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('coupons') + '/validate'
        : 'http://localhost:5000/api/coupons/validate';
      
      const couponResponse = await fetch(couponApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          subtotal: subtotal,
          cylinderType: cylinderTypeForApi,
        }),
      });

      const couponData = await couponResponse.json();

      if (couponResponse.ok && couponData.success && couponData.data) {
        couponState = { status: 'applied', code: couponData.data.code };
        setPlainError(errCouponEl, '');
      } else {
        couponState = { status: 'idle', code: '' };
        setPlainError(errCouponEl, couponData.error || 'Invalid coupon code.');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      couponState = { status: 'idle', code: '' };
      setPlainError(errCouponEl, 'Failed to validate coupon. Please try again.');
    }

    renderPrice();
  };

  // Snapshot for UI display only - prices calculated on backend
  const getSubmissionSnapshot = () => {
    const totals = computeTotals();
    const couponCode =
      couponState.status === 'applied'
        ? couponState.code
        : '';
    return {
      type: totals.type,
      qty: totals.qty,
      unit: 0, // Calculated on backend
      subtotal: 0, // Calculated on backend
      discount: 0, // Calculated on backend
      discountPct: 0, // Calculated on backend
      finalTotal: 0, // Calculated on backend
      couponCode,
    };
  };

  const submitOrder = async (payload) => {
    // Normalize cylinderType to match backend enum ('Domestic' or 'Commercial')
    let type = '';
    if (payload.cylinderType) {
      const lower = payload.cylinderType.toLowerCase();
      if (lower === 'domestic' || lower === 'commercial') {
        type = lower.charAt(0).toUpperCase() + lower.slice(1);
      } else {
        type = payload.cylinderType.charAt(0).toUpperCase() + payload.cylinderType.slice(1).toLowerCase();
      }
    }
    
    // Ensure quantity is a number
    const quantity = typeof payload.quantity === 'number' 
      ? payload.quantity 
      : parseInt(payload.quantity, 10);
    
    // Send ONLY user input data - backend calculates prices
    // Note: Simple endpoint uses 'name' instead of 'customerName'
    const requestBody = {
      name: payload.customerName, // Map to 'name' for simple endpoint
      phone: payload.phone,
      address: payload.address,
      cylinderType: type, // 'Domestic' or 'Commercial'
      quantity: quantity,
      couponCode: payload.coupon && payload.coupon.trim() ? payload.coupon.trim().toUpperCase() : undefined,
    };
    
    // Log request for debugging
    console.log('📤 Sending order request:', requestBody);
    
    try {
      // Use centralized API config if available, otherwise use default
      // Note: Using /api/order (simple endpoint) for consistency with React component
      const apiUrl = (typeof window !== 'undefined' && window.getApiUrl) 
        ? window.getApiUrl('order') 
        : 'http://localhost:5000/api/order';
      
      console.log('🌐 API URL:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
          console.error('❌ API Error Response:', errorData);
        } catch (jsonError) {
          const text = await res.text().catch(() => 'No error details');
          console.error('❌ API Error (non-JSON):', text);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
       
      let data;
      try {
        data = await res.json();
        console.log('✅ API Success Response:', data);
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
      
      if (!data.success || !data.data) {
        console.error('❌ Invalid response structure:', data);
        throw new Error(data.error || 'Invalid response from server');
      }
      
      // Validate required fields with fallbacks
      if (!data.data.orderId) {
        console.error('❌ Missing orderId in response:', data);
        throw new Error('Invalid response: missing order ID');
      }
      
      console.log('✅ Order created successfully:', data.data.orderId);
      
      return {
        orderId: data.data.orderId,
        status: data.data.status || 'pending',
        createdAt: data.data.createdAt ? new Date(data.data.createdAt) : new Date(),
        pricePerCylinder: data.data.pricePerCylinder || 0,
        subtotal: data.data.subtotal || 0,
        discount: data.data.discount || 0,
        totalPrice: data.data.totalPrice || 0,
        couponCode: data.data.couponCode || null
      };
    } catch (error) {
      console.error('❌ Order submission failed:', error);
      console.error('   Request was:', requestBody);
      throw error;
    }
  };

  const beginSubmit = async () => {
    if (submitState.status === 'submitting' || submitState.status === 'success') return;

    const errs = validate();
    renderQtyWarning();
    renderPrice();

    if (errs.length > 0) {
      errs[0].el.focus();
      return;
    }

    // Disable everything and show spinner.
    submitState.status = 'submitting';
    setControlsDisabled(true);
    setSubmitUI('loading', '');

    if (hasSidecardUI) {
      retryBtn.classList.add('is-hidden');
      sidecardErrEl.classList.add('is-hidden');
      sidecardErrEl.textContent = '';
    }

    // Get selected type and ensure it's valid
    const selectedType = getSelectedType();
    if (!selectedType) {
      setPlainError(errTypeEl, 'Please select a cylinder type.');
      submitState.status = 'error';
      setControlsDisabled(false);
      setSubmitUI('idle', 'Please select a cylinder type.');
      return;
    }
    
    const payload = {
      customerName: nameEl.value.trim(),
      phone: phoneEl.value.trim(),
      address: addressEl.value.trim(),
      cylinderType: selectedType, // Will be normalized in submitOrder
      quantity: getQty(), // Already returns a number
      coupon: couponEl.value.trim() || null,
    };
    
    // Validate payload before sending
    if (!payload.customerName || !payload.phone || !payload.address || !payload.cylinderType || !payload.quantity) {
      console.error('❌ Invalid payload:', payload);
      setControlsDisabled(false);
      setSubmitUI('idle', 'Please fill all required fields.');
      return;
    }
    
    console.log('📋 Order payload prepared:', payload);
    submitState.lastPayload = payload;

    try {
      const res = await submitOrder(payload);

      submitState.status = 'success';
      submitState.lastOrder = res;
      // Store order data from backend response (no snapshot needed)
      // Calculate discount percentage safely
      const discountPct = (res.subtotal > 0 && res.discount > 0) 
        ? Math.round((res.discount / res.subtotal) * 100) 
        : 0;
      
      submitState.lastSnapshot = {
        type: payload.cylinderType && payload.cylinderType.toLowerCase() === 'commercial' ? 'commercial' : 'domestic',
        qty: payload.quantity || 0,
        unit: res.pricePerCylinder || 0,
        subtotal: res.subtotal || 0,
        discount: res.discount || 0,
        discountPct: discountPct,
        finalTotal: res.totalPrice || 0,
        couponCode: res.couponCode || ''
      };

      // Keep form disabled to prevent double submission.
      setSubmitUI('idle', '');
      submitBtn.disabled = true;

      if (hasSidecardUI) {
        renderOrderCard(res, submitState.lastSnapshot);
        openSidecard();
        startStatusSimulation();
        showToast('Order confirmed. Pay on delivery.', 'View Order', () => {
          if (typeof window.openCartPage === 'function') {
            window.openCartPage();
          } else {
            openSidecard();
          }
        });
        setCartIndicator(true);
      }
    } catch (e) {
      console.error('Order submission error:', e);
      submitState.status = 'error';
      setControlsDisabled(false);
      setSubmitUI('idle', e instanceof Error ? e.message : 'Network error. Please retry.');

      if (hasSidecardUI) {
        retryBtn.classList.remove('is-hidden');
        sidecardErrEl.classList.remove('is-hidden');
        sidecardErrEl.textContent = 'Could not confirm your order. Please retry.';
        showToast('Could not confirm order.', 'Retry', () => beginSubmit());
        openSidecard();
        setCartIndicator(true);
      }
    }
  };

  // Event wiring
  nameEl.addEventListener('blur', () => {
    const capped = capitalizeWords(nameEl.value);
    if (capped !== nameEl.value) nameEl.value = capped;
  });

  phoneEl.addEventListener('input', () => {
    const next = sanitizePhone(phoneEl.value);
    if (next !== phoneEl.value) phoneEl.value = next;
    if (phoneEl.getAttribute('aria-invalid') === 'true') validate();
  });

  addressEl.addEventListener('input', () => {
    if (addressEl.getAttribute('aria-invalid') === 'true') validate();
  });

  qtyEl.addEventListener('input', () => {
    renderQtyWarning();
    renderPrice();
    if (qtyEl.getAttribute('aria-invalid') === 'true') validate();
  });

  qtyEl.addEventListener('blur', () => {
    qtyEl.value = String(getQty());
    renderQtyWarning();
    renderPrice();
  });

  form.addEventListener('click', (event) => {
    const btn = /** @type {HTMLElement|null} */ (event.target instanceof HTMLElement ? event.target.closest('[data-qty-step]') : null);
    if (!btn) return;
    const step = Number(btn.getAttribute('data-qty-step') || '0');
    if (!Number.isFinite(step) || step === 0) return;

    const next = clampInt(getQty() + step, 1, 999);
    qtyEl.value = String(next);
    renderQtyWarning();
    renderPrice();
  });

  typeRadios.forEach((r) => {
    r.addEventListener('change', () => {
      updateTypeCardsA11y();
      setPlainError(errTypeEl, '');
      renderPrice();
    });
  });

  couponApplyBtn.addEventListener('click', () => applyCoupon());
  couponEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyCoupon();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    beginSubmit();
  });

  // Initial render
  updateTypeCardsA11y();
  renderQtyWarning();
  renderPrice();

  // Cart indicator will be set when a new order is submitted
  // No localStorage initialization needed

  // Toast + sidecard events
  if (hasSidecardUI) {
    toastCloseBtn.addEventListener('click', () => hideToast());

    sidecardCloseBtn.addEventListener('click', () => closeSidecard());
    miniCartBtn.addEventListener('click', () => {
      // Navigate to cart page instead of opening sidecard
      if (typeof window.openCartPage === 'function') {
        window.openCartPage();
      } else {
        openSidecard();
      }
    });
    navCartBtn.addEventListener('click', () => {
      // Navigate to cart page instead of opening sidecard
      if (typeof window.openCartPage === 'function') {
        window.openCartPage();
      } else {
        openSidecard();
      }
    });
    sidecardBackdropEl.addEventListener('click', () => closeSidecard());

    // Expose openSidecard and updateSidecardFromCart globally for product-detail.js integration
    window.openSidecard = openSidecard;
    window.updateSidecardFromCart = updateSidecardFromCart;
    window.setCartIndicator = setCartIndicator;

    sidecardToggleBtn.addEventListener('click', () => {
      const collapsed = sidecardEl.classList.toggle('is-collapsed');
      sidecardToggleBtn.textContent = collapsed ? 'Expand' : 'Collapse';
      sidecardToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });

    proceedCheckoutBtn.addEventListener('click', () => openCheckout());

    retryBtn.addEventListener('click', () => beginSubmit());

    const onSidecardKeyDown = (event) => {
      if (!sidecardLayerEl.classList.contains('is-open')) return;
      if (!(event.target instanceof Node) || !sidecardEl.contains(event.target)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeSidecard();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = getFocusableEls(sidecardEl);
      if (focusables.length === 0) {
        event.preventDefault();
        sidecardEl.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === sidecardEl) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onSidecardKeyDown, true);
  }

  // Checkout screen events
  if (hasCheckoutUI) {
    checkoutCloseBtn.addEventListener('click', () => closeCheckout());
    checkoutBackdropEl.addEventListener('click', () => closeCheckout());

    const onCheckoutKeyDown = (event) => {
      if (!checkoutLayerEl.classList.contains('is-open')) return;
      if (!(event.target instanceof Node) || !checkoutDialogEl.contains(event.target)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeCheckout();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = getFocusableEls(checkoutDialogEl);
      if (focusables.length === 0) {
        event.preventDefault();
        checkoutDialogEl.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === checkoutDialogEl) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onCheckoutKeyDown, true);

    // Place order button (disabled for now - mock only)
    checkoutPlaceOrderBtn.addEventListener('click', () => {
      // Mock: Just show a message
      alert('Order placement is disabled in this demo. Payment will be collected on delivery.');
    });
  }
});

// Site-wide Notification Banner (Centered, Auto-hide)
(() => {
  'use strict';

  const notificationEl = document.getElementById('site-notification');
  
  if (!notificationEl) return;

  const AUTO_HIDE_DURATION = 4000; // 4 seconds

  const showNotification = () => {
    notificationEl.classList.add('is-visible');
    
    // Auto-hide after duration
    window.setTimeout(() => {
      hideNotification();
    }, AUTO_HIDE_DURATION);
  };

  const hideNotification = () => {
    notificationEl.classList.remove('is-visible');
    notificationEl.classList.add('is-closing');
    
    window.setTimeout(() => {
      notificationEl.style.display = 'none';
    }, 600);
  };

  // Show notification on page load (with small delay for smooth entry)
  window.setTimeout(() => {
    showNotification();
  }, 300);
})();

