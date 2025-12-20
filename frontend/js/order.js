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
    const nodes = Array.from(dialog.querySelectorAll(focusableSelector));
    return nodes.filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
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
(() => {
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

  const typeCards = Array.from(document.querySelectorAll('[data-cylinder-card]'));
  const typeRadios = Array.from(form.querySelectorAll('input[name="cylinderType"]'));

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

  const PRICES = {
    domestic: 3200,
    commercial: 12800,
  };

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

  /** @type {{ status: 'idle'|'checking'|'applied'|'invalid', code: string, kind?: 'percent'|'flat', value?: number, percent?: number }} */
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
    const nodes = Array.from(rootEl.querySelectorAll(focusableSelector));
    return nodes.filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
  };

  const setCartIndicator = (active) => {
    if (!hasSidecardUI) return;
    // Update both desktop nav cart dot and mobile mini-cart dot
    if (navCartDot) navCartDot.classList.toggle('is-active', !!active);
    const miniCartDot = miniCartBtn ? miniCartBtn.querySelector('.order-mini-cart__dot') : null;
    if (miniCartDot) miniCartDot.classList.toggle('is-active', !!active);
    
    // Show/hide mini cart button on mobile based on orders
    if (miniCartBtn && window.OrderStorage) {
      const orderCount = window.OrderStorage.getOrderCount();
      if (orderCount > 0) {
        miniCartBtn.classList.remove('is-hidden');
      } else if (!active) {
        // Only hide if no active indicator and no orders
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

  const computeTotals = () => {
    const type = getSelectedType();
    const qty = getQty();
    const unit = type === 'commercial' ? PRICES.commercial : PRICES.domestic;
    const subtotal = unit * qty;

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
    return { type, qty, unit, subtotal, discount, discountPct, finalTotal };
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
      unitPriceEl.textContent = formatPKR(t.unit);
      qtyDisplayEl.textContent = String(t.qty);
      totalEl.textContent = formatPKR(t.subtotal);

      const hasDiscount = t.discount > 0 && couponState.status === 'applied';
      totalEl.classList.toggle('is-struck', hasDiscount);
      discountRowEl.classList.toggle('is-hidden', !hasDiscount);
      finalRowEl.classList.toggle('is-hidden', !hasDiscount);

      if (hasDiscount) {
        discountLabelEl.textContent = 'Discount';
        discountValueEl.textContent = `${formatPKR(t.discount)} (${t.discountPct}%)`;
        finalTotalEl.textContent = formatPKR(t.finalTotal);
      }
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
    if (window.CartManager) {
      const cart = window.CartManager.getCart();
      if (cart.items && cart.items.length > 0) {
        // Aggregate cart items for display
        const totalQty = cart.totalItems;
        const subtotal = cart.subtotal;
        const firstItem = cart.items[0];
        
        // Update sidecard display
        if (orderIdEl) orderIdEl.textContent = 'Cart Items';
        if (orderCreatedAtEl) orderCreatedAtEl.textContent = new Date().toLocaleString();
        if (orderEtaEl) orderEtaEl.textContent = '+24 hours';
        
        const typeLabel = firstItem.type === 'commercial' ? 'Commercial' : 'Domestic';
        if (cart.items.length > 1) {
          if (orderCylinderEl) orderCylinderEl.textContent = `${typeLabel} + ${cart.items.length - 1} more`;
        } else {
          if (orderCylinderEl) orderCylinderEl.textContent = typeLabel;
        }
        if (orderQtyEl) orderQtyEl.textContent = String(totalQty);
        if (orderCouponUsedEl) orderCouponUsedEl.textContent = 'No coupon';

        if (bdUnitEl) bdUnitEl.textContent = formatPKR(firstItem.unitPrice);
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
    if (window.CartManager) {
      const cart = window.CartManager.getCart();
      if (cart.items && cart.items.length > 0) {
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

    checkoutOrderIdEl.textContent = order.orderId;
    checkoutStatusEl.textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    checkoutCreatedAtEl.textContent = new Date(order.createdAt).toLocaleString();
    checkoutEtaEl.textContent = order.estimatedDelivery;

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
    orderIdEl.textContent = order.orderId;
    orderCreatedAtEl.textContent = new Date(order.createdAt).toLocaleString();
    orderEtaEl.textContent = order.estimatedDelivery;

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

    setStatus(order.status);
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
    const digitsCount = phone.replace(/[^\d]/g, '').length;
    if (!phone) errors.push({ el: phoneEl, err: errPhoneEl, msg: 'Phone number is required.' });
    else if (!/^\+?\d+$/.test(phone)) errors.push({ el: phoneEl, err: errPhoneEl, msg: 'Use numbers only (optional “+” at start).' });
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

  const applyCoupon = () => {
    const code = couponEl.value.trim().toUpperCase();
    couponEl.value = code;

    // Clear coupon state if user empties the field.
    if (!code) {
      couponState = { status: 'idle', code: '' };
      setPlainError(errCouponEl, '');
      renderPrice();
      return;
    }

    couponState = { status: 'checking', code };
    setPlainError(errCouponEl, '');
    couponApplyBtn.disabled = true;
    const prevLabel = couponApplyBtn.textContent;
    couponApplyBtn.textContent = 'Applying…';

    const delay = 500 + Math.floor(Math.random() * 201); // 500–700ms
    window.setTimeout(() => {
      if (code === 'WELCOME10') {
        couponState = { status: 'applied', code, kind: 'percent', value: 10 };
        setPlainError(errCouponEl, '');
      } else if (code === 'FLAT500') {
        couponState = { status: 'applied', code, kind: 'flat', value: 500 };
        setPlainError(errCouponEl, '');
      } else {
        couponState = { status: 'invalid', code };
        setPlainError(errCouponEl, 'Invalid coupon code.');
      }

      couponApplyBtn.disabled = false;
      couponApplyBtn.textContent = prevLabel || 'Apply';

      // If invalid, remove discounts from totals (but keep the code visible).
      if (couponState.status !== 'applied') {
        couponState = { status: 'idle', code: couponState.code };
      }

      renderPrice();
    }, delay);
  };

  const getSubmissionSnapshot = () => {
    const totals = computeTotals();
    const couponCode =
      couponState.status === 'applied'
        ? couponState.code
        : '';
    return {
      type: totals.type,
      qty: totals.qty,
      unit: totals.unit,
      subtotal: totals.subtotal,
      discount: totals.discount,
      discountPct: totals.discountPct,
      finalTotal: totals.finalTotal,
      couponCode,
    };
  };

  const mockSubmit = (payload) =>
    new Promise((resolve, reject) => {
      const delay = 800 + Math.floor(Math.random() * 201); // 800–1000ms
      window.setTimeout(() => {
        // Simulated failure rate.
        const fail = Math.random() < 0.18;
        if (fail) {
          reject(new Error('Simulated network failure. Please retry.'));
          return;
        }

        resolve({
          orderId: `ORD${Date.now()}`,
          status: 'confirmed',
          createdAt: new Date(),
          estimatedDelivery: '+24 hours',
        });
      }, delay);
    });

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

    const payload = {
      customerName: nameEl.value.trim(),
      phone: phoneEl.value.trim(),
      address: addressEl.value.trim(),
      cylinderType: getSelectedType(),
      quantity: getQty(),
      coupon: couponEl.value.trim().toUpperCase() || null,
      totals: computeTotals(),
    };
    submitState.lastPayload = payload;

    try {
      const res = await mockSubmit(payload);
      const snapshot = getSubmissionSnapshot();

      submitState.status = 'success';
      submitState.lastOrder = res;
      submitState.lastSnapshot = snapshot;

      // Save order to localStorage
      if (window.OrderStorage) {
        const totals = snapshot;
        window.OrderStorage.saveOrder({
          productId: 'manual',
          productName: `${snapshot.type === 'commercial' ? 'Commercial' : 'Domestic'} LPG Cylinder`,
          cylinderType: snapshot.type,
          quantity: snapshot.qty,
          unitPrice: snapshot.unit,
          subtotal: snapshot.subtotal,
          discount: snapshot.discount,
          finalPrice: snapshot.finalTotal,
          couponCode: snapshot.couponCode || null,
          customerName: payload.customerName,
          phone: payload.phone,
          address: payload.address
        });
      }

      // Keep form disabled to prevent double submission.
      setSubmitUI('idle', '');
      submitBtn.disabled = true;

      if (hasSidecardUI) {
        renderOrderCard(res, snapshot);
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

  // Initialize cart indicator based on stored orders
  if (hasSidecardUI && window.OrderStorage) {
    const orderCount = window.OrderStorage.getOrderCount();
    if (orderCount > 0) {
      setCartIndicator(true);
      if (miniCartBtn) {
        miniCartBtn.classList.remove('is-hidden');
      }
    }
  }

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
})();

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

