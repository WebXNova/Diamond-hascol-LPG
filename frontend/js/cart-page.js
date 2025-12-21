(() => {
  'use strict';

  const cartPage = document.getElementById('cart-page');
  const cartPageClose = document.getElementById('cart-page-close');
  const cartPageOrders = document.getElementById('cart-page-orders');
  const cartPageEmpty = document.getElementById('cart-page-empty');

  if (!cartPage || !cartPageOrders || !cartPageEmpty) return;

  const formatPKR = (n) => {
    const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
    return `₨${moneyFmt.format(Math.max(0, Math.round(n)))}`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString || '—';
    }
  };

  const renderOrderCard = (order) => {
    const card = document.createElement('div');
    card.className = 'cart-order-card';
    const itemKey = order.itemId || order.id;
    card.setAttribute('data-order-id', itemKey);

    const qty = order.quantity || 1;
    const unitPrice = order.unitPrice || 0;
    const subtotal = (unitPrice) * qty;
    const discount = (order.meta && typeof order.meta.discount === 'number') ? order.meta.discount : (order.discount || 0);
    const totalFromMeta = (order.meta && typeof order.meta.finalTotal === 'number') ? order.meta.finalTotal : null;
    const total = (typeof totalFromMeta === 'number') ? totalFromMeta : (order.totalPrice || order.finalPrice || (subtotal - discount));
    const couponCode =
      (order.meta && order.meta.couponCode) ? order.meta.couponCode :
      (order.couponCode || null);
    const typeValue = order.type || order.cylinderType || 'domestic';

    card.innerHTML = `
      <div class="cart-order-card__header">
        <div class="cart-order-card__title-row">
          <h3 class="cart-order-card__title">Cart Item</h3>
          <span class="cart-order-card__date">${order.createdAt ? formatDate(order.createdAt) : '—'}</span>
        </div>
        <button type="button" class="cart-order-card__delete" data-order-id="${itemKey}" aria-label="Remove from cart">×</button>
      </div>
      <div class="cart-order-card__body">
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Product:</span>
          <span class="cart-order-card__value">${order.productName || order.name || '—'}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Cylinder Type:</span>
          <span class="cart-order-card__value">${String(typeValue).toLowerCase() === 'commercial' ? 'Commercial' : 'Domestic'}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Quantity:</span>
          <span class="cart-order-card__value">
            <button type="button" class="cart-order-card__qty-btn" data-qty-step="-1" data-order-id="${itemKey}" style="width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: #fff; cursor: pointer;">−</button>
            <span style="display:inline-block; min-width: 32px; text-align:center;">${qty}</span>
            <button type="button" class="cart-order-card__qty-btn" data-qty-step="1" data-order-id="${itemKey}" style="width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: #fff; cursor: pointer;">+</button>
          </span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Unit Price:</span>
          <span class="cart-order-card__value">${formatPKR(unitPrice)}</span>
        </div>
        ${order.customerName ? `
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Customer:</span>
          <span class="cart-order-card__value">${order.customerName}</span>
        </div>
        ` : ''}
        ${order.phone ? `
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Phone:</span>
          <span class="cart-order-card__value">${order.phone}</span>
        </div>
        ` : ''}
        ${order.address ? `
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Address:</span>
          <span class="cart-order-card__value">${order.address}</span>
        </div>
        ` : ''}
        <div class="cart-order-card__divider"></div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Subtotal:</span>
          <span class="cart-order-card__value ${discount > 0 ? 'is-struck' : ''}">${formatPKR(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="cart-order-card__row cart-order-card__row--discount">
          <span class="cart-order-card__label">Discount:</span>
          <span class="cart-order-card__value">${formatPKR(discount)} ${couponCode ? `(${couponCode})` : ''}</span>
        </div>
        ` : ''}
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Coupon:</span>
          <span class="cart-order-card__value">${couponCode || 'No coupon'}</span>
        </div>
        <div class="cart-order-card__row cart-order-card__row--total">
          <span class="cart-order-card__label">Total:</span>
          <span class="cart-order-card__value cart-order-card__value--total">${formatPKR(total)}</span>
        </div>
      </div>
    `;

    // Add delete button handler
    const deleteBtn = card.querySelector('.cart-order-card__delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = deleteBtn.getAttribute('data-order-id');
        if (key && window.CartManager && typeof window.CartManager.removeItem === 'function') {
          window.CartManager.removeItem(key);
          loadOrders();
        }
      });
    }

    // Qty button handlers
    card.querySelectorAll('.cart-order-card__qty-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const step = parseInt(btn.getAttribute('data-qty-step') || '0', 10);
        const key = btn.getAttribute('data-order-id');
        if (!key || !step) return;
        if (!window.CartManager || typeof window.CartManager.updateItem !== 'function') return;

        const currentCart = window.CartManager.getCart();
        const item = Array.isArray(currentCart.items) ? currentCart.items.find((it) => it.itemId === key) : null;
        if (!item) return;

        const nextQty = Math.max(1, (item.quantity || 1) + step);
        window.CartManager.updateItem(key, { quantity: nextQty });
        loadOrders();
      });
    });

    return card;
  };

  const loadOrders = () => {
    // Option A: Client-side cart persistence (localStorage) via CartManager
    const cart = (window.CartManager && typeof window.CartManager.getCart === 'function')
      ? window.CartManager.getCart()
      : { items: [] };

    const orders = Array.isArray(cart.items) ? cart.items : [];

    // Update cart indicator
    if (typeof window.setCartIndicator === 'function') {
      window.setCartIndicator(orders.length > 0);
    }

    // Show/hide mini cart button
    const miniCartBtn = document.getElementById('order-mini-cart');
    if (miniCartBtn) {
      if (orders.length > 0) {
        miniCartBtn.classList.remove('is-hidden');
      } else {
        miniCartBtn.classList.add('is-hidden');
      }
    }

    if (orders.length === 0) {
      cartPageEmpty.classList.remove('is-hidden');
      cartPageOrders.classList.add('is-hidden');
      cartPageOrders.innerHTML = '';
    } else {
      cartPageEmpty.classList.add('is-hidden');
      cartPageOrders.classList.remove('is-hidden');
      cartPageOrders.innerHTML = '';

      orders.forEach(order => {
        const card = renderOrderCard(order);
        cartPageOrders.appendChild(card);
      });
    }
  };

  const openCartPage = () => {
    if (!cartPage) return;
    cartPage.classList.remove('is-hidden');
    document.body.classList.add('cart-page-open');
    window.location.hash = '#cart';
    loadOrders();
  };

  const closeCartPage = () => {
    if (!cartPage) return;
    cartPage.classList.add('is-hidden');
    document.body.classList.remove('cart-page-open');
    if (window.location.hash === '#cart') {
      window.location.hash = '#products';
    }
  };

  // Event listeners
  if (cartPageClose) {
    cartPageClose.addEventListener('click', closeCartPage);
  }

  // Handle hash changes
  const handleHashChange = () => {
    const hash = window.location.hash;
    if (hash === '#cart') {
      openCartPage();
    } else if (cartPage && !cartPage.classList.contains('is-hidden')) {
      closeCartPage();
    }
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      handleHashChange();
      // Note: Order count should come from backend API
      // For now, cart indicator is managed by CartManager (UI-only)
    });
  } else {
    handleHashChange();
    // Note: Order count should come from backend API
    // For now, cart indicator is managed by CartManager (UI-only)
  }

  window.addEventListener('hashchange', handleHashChange);

  // Expose globally
  window.openCartPage = openCartPage;
  window.loadCartOrders = loadOrders;
})();

