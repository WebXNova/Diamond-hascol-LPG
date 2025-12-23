(() => {
  'use strict';

  const cartPage = document.getElementById('cart-page');
  const cartPageClose = document.getElementById('cart-page-close');
  const cartPageOrders = document.getElementById('cart-page-orders');
  const cartPageEmpty = document.getElementById('cart-page-empty');

  if (!cartPage || !cartPageOrders || !cartPageEmpty) return;

  /** @type {number|null} */
  let refreshIntervalId = null;

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

  const esc = (value) => {
    // Decode numeric HTML entities first (e.g. "&#x2F;" -> "/") then escape for XSS safety.
    // This fixes cases where backend/data already contains encoded entities.
    const decoded = String(value)
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const cp = parseInt(hex, 16);
        return Number.isFinite(cp) && cp >= 0 ? String.fromCodePoint(cp) : _;
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const cp = parseInt(dec, 10);
        return Number.isFinite(cp) && cp >= 0 ? String.fromCodePoint(cp) : _;
      });

    if (typeof window !== 'undefined' && window.SafeRender && typeof window.SafeRender.escapeHtml === 'function') {
      return window.SafeRender.escapeHtml(decoded);
    }

    return decoded
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeText = (value, fallback = '—') => {
    if (value === null || value === undefined) return fallback;
    const s = String(value).trim();
    return s ? s : fallback;
  };

  const toNumberOrNull = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const getOrderProductName = (order) => {
    const ct = safeText(order && order.cylinderType, '').toLowerCase();
    if (ct === 'commercial') return 'Commercial LPG Cylinder';
    if (ct === 'domestic') return 'Domestic LPG Cylinder';
    return safeText(order && (order.productName || order.name), '—');
  };

  const getStatusKey = (raw) => {
    const s = safeText(raw, '').toLowerCase();
    if (s === 'pending' || s === 'confirmed' || s === 'delivered' || s === 'cancelled') return s;
    return 'unknown';
  };

  const getStatusLabel = (key) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      unknown: 'Unknown',
    };
    return labels[key] || 'Unknown';
  };

  const renderStatusBadge = (statusRaw) => {
    const key = getStatusKey(statusRaw);
    const label = getStatusLabel(key);
    return `<span class="cart-status-badge cart-status-badge--${key}">${esc(label)}</span>`;
  };

  const renderOrderCard = (order) => {
    const card = document.createElement('div');
    card.className = 'cart-order-card';
    const itemKey = order.itemId || order.id || order.orderId;
    card.setAttribute('data-order-id', itemKey);
    card.setAttribute('data-is-placed-order', order._isPlacedOrder === true ? 'true' : 'false');

    // Extract all order data from various possible locations
    const orderId = safeText(order.orderId || order.id || order.itemId);
    const productName = getOrderProductName(order);
    const typeValue = safeText(order.type || order.cylinderType || 'domestic', 'domestic');
    const cylinderTypeDisplay = String(typeValue).toLowerCase() === 'commercial' ? 'Commercial' : 'Domestic';

    // Determine if this is a cart item (can be edited) or a placed order (read-only)
    // Placed orders must render from backend fields only.
    const isPlacedOrder =
      order._isPlacedOrder === true ||
      (order.id && typeof order.id === 'string' && (order.id.startsWith('ORD-') || order.timestamp));

    const qty = isPlacedOrder ? safeText(order.quantity, '—') : (Number.isFinite(Number(order.quantity)) ? Number(order.quantity) : 1);

    const unitPrice = isPlacedOrder
      ? toNumberOrNull(order.pricePerCylinder)
      : toNumberOrNull(order.unitPrice || order.unit || 0);

    const subtotal = isPlacedOrder ? toNumberOrNull(order.subtotal) : (unitPrice === null ? null : (unitPrice * (Number(qty) || 0)));

    const discount = isPlacedOrder
      ? toNumberOrNull(order.discount)
      : (order.meta && typeof order.meta.discount === 'number') ? order.meta.discount : toNumberOrNull(order.discount || 0);

    const totalFromMeta = (!isPlacedOrder && order.meta && typeof order.meta.finalTotal === 'number') ? order.meta.finalTotal : null;
    const total = isPlacedOrder
      ? toNumberOrNull(order.totalPrice || order.total)
      : (typeof totalFromMeta === 'number' ? totalFromMeta : toNumberOrNull(order.total || order.totalPrice || order.finalPrice || (subtotal === null ? 0 : (subtotal - (discount || 0)))));

    const couponCode =
      (order.meta && order.meta.couponCode) ? order.meta.couponCode :
      (order.couponCode || order.coupon || null);

    const customerName = safeText(order.customerName || (order.meta && order.meta.customerName) || '—');
    const phone = safeText(order.phone || (order.meta && order.meta.phone) || '—');
    const address = safeText(order.address || (order.meta && order.meta.address) || '—');
    const statusRaw = safeText(order.status || (order.meta && order.meta.status) || 'pending', 'pending');
    const statusBadge = renderStatusBadge(statusRaw);
    const createdAt = order.createdAt || (order.meta && order.meta.createdAt) || null;

    const canEdit = !isPlacedOrder;

    card.innerHTML = `
      <div class="cart-order-card__header">
        <div class="cart-order-card__title-row">
          <h3 class="cart-order-card__title">${isPlacedOrder ? 'Order' : 'Cart Item'}</h3>
          <span class="cart-order-card__date">${createdAt ? esc(formatDate(createdAt)) : '—'}</span>
        </div>
        ${canEdit ? `<button type="button" class="cart-order-card__delete" data-order-id="${esc(itemKey)}" aria-label="Remove from cart">×</button>` : ''}
      </div>
      <div class="cart-order-card__body">
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Order ID:</span>
          <span class="cart-order-card__value">${esc(orderId)}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Product / Cylinder Name:</span>
          <span class="cart-order-card__value">${esc(safeText(productName))}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Cylinder Type:</span>
          <span class="cart-order-card__value">${esc(cylinderTypeDisplay)}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Quantity:</span>
          <span class="cart-order-card__value">
            <span>${esc(String(qty))}</span>
          </span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Price per Cylinder:</span>
          <span class="cart-order-card__value">${unitPrice === null ? '—' : esc(formatPKR(unitPrice))}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Subtotal:</span>
          <span class="cart-order-card__value ${discount && discount > 0 ? 'is-struck' : ''}">${subtotal === null ? '—' : esc(formatPKR(subtotal))}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Customer Name:</span>
          <span class="cart-order-card__value">${esc(customerName)}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Phone Number:</span>
          <span class="cart-order-card__value">${esc(phone)}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Delivery Address:</span>
          <span class="cart-order-card__value">${esc(address)}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Coupon Used:</span>
          <span class="cart-order-card__value">${esc(couponCode || 'None')}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Order Status:</span>
          <span class="cart-order-card__value">${statusBadge}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Created At:</span>
          <span class="cart-order-card__value">${createdAt ? esc(formatDate(createdAt)) : '—'}</span>
        </div>
        ${discount && discount > 0 ? `
        <div class="cart-order-card__divider"></div>
        <div class="cart-order-card__row cart-order-card__row--discount">
          <span class="cart-order-card__label">Discount:</span>
          <span class="cart-order-card__value">${esc(formatPKR(discount))} ${couponCode ? `(${esc(couponCode)})` : ''}</span>
        </div>
        ` : ''}
        <div class="cart-order-card__divider"></div>
        <div class="cart-order-card__row cart-order-card__row--total">
          <span class="cart-order-card__label">Total:</span>
          <span class="cart-order-card__value cart-order-card__value--total">${total === null ? '—' : esc(formatPKR(total))}</span>
        </div>
      </div>
    `;

    // Add delete button handler (cart items only)
    const deleteBtn = card.querySelector('.cart-order-card__delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = deleteBtn.getAttribute('data-order-id');
        if (!key) return;

        if (window.CartManager && typeof window.CartManager.removeItem === 'function') {
          window.CartManager.removeItem(key);
        }
        void loadOrders();
      });
    }

    return card;
  };

  const fetchOrderById = async (orderId) => {
    const id = safeText(orderId, '').trim();
    if (!id) return null;

    const apiUrl = (typeof window !== 'undefined' && window.getApiUrl)
      ? `${window.getApiUrl('orders')}/${encodeURIComponent(id)}`
      : `http://localhost:5000/api/orders/${encodeURIComponent(id)}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      let data = null;
      try { data = await response.json(); } catch (_) {}

      if (response.ok && data && data.success && data.data) {
        return data.data;
      }

      // Graceful fallback (do not throw; render minimal card)
      return { orderId: id, status: 'unknown' };
    } catch (_) {
      return { orderId: id, status: 'unknown' };
    }
  };

  const loadOrders = async () => {
    // Get cart items from CartManager (localStorage: lpg_cart)
    const cart = (window.CartManager && typeof window.CartManager.getCart === 'function')
      ? window.CartManager.getCart()
      : { items: [] };

    const cartItems = Array.isArray(cart.items) ? cart.items : [];

    // Get locally saved order IDs (privacy-safe: IDs only) then fetch LIVE order details from backend
    const placedOrderIds = (window.OrderStorage && typeof window.OrderStorage.getAllOrderIds === 'function')
      ? window.OrderStorage.getAllOrderIds()
      : (window.OrderStorage && typeof window.OrderStorage.getAllOrders === 'function')
        ? window.OrderStorage.getAllOrders()
        : [];

    const settled = await Promise.allSettled(placedOrderIds.map(fetchOrderById));
    const markedPlacedOrders = settled
      .map((r) => (r && r.status === 'fulfilled' ? r.value : null))
      .filter(Boolean)
      .map((o) => ({ ...o, _isPlacedOrder: true }));

    const markedCartItems = cartItems.map(item => ({ ...item, _isPlacedOrder: false }));
    
    // Combine both: show placed orders first, then cart items
    const allOrders = [...markedPlacedOrders, ...markedCartItems];

    // Update cart indicator (only for cart items, not placed orders)
    if (typeof window.setCartIndicator === 'function') {
      window.setCartIndicator(cartItems.length > 0);
    }

    // Show/hide mini cart button (only for cart items)
    const miniCartBtn = document.getElementById('order-mini-cart');
    if (miniCartBtn) {
      if (cartItems.length > 0) {
        miniCartBtn.classList.remove('is-hidden');
      } else {
        miniCartBtn.classList.add('is-hidden');
      }
    }

    if (allOrders.length === 0) {
      cartPageEmpty.classList.remove('is-hidden');
      cartPageOrders.classList.add('is-hidden');
      cartPageOrders.innerHTML = '';
    } else {
      cartPageEmpty.classList.add('is-hidden');
      cartPageOrders.classList.remove('is-hidden');
      cartPageOrders.innerHTML = '';

      allOrders.forEach(order => {
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
    void loadOrders();

    // Live refresh while open (reflect admin status updates)
    if (refreshIntervalId) {
      window.clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }
    refreshIntervalId = window.setInterval(() => {
      if (cartPage && !cartPage.classList.contains('is-hidden')) {
        void loadOrders();
      }
    }, 15000);
  };

  const closeCartPage = () => {
    if (!cartPage) return;
    cartPage.classList.add('is-hidden');
    document.body.classList.remove('cart-page-open');
    if (window.location.hash === '#cart') {
      window.location.hash = '#products';
    }

    if (refreshIntervalId) {
      window.clearInterval(refreshIntervalId);
      refreshIntervalId = null;
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

