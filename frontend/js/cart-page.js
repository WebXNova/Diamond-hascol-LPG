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
    card.setAttribute('data-order-id', order.id);

    const subtotal = (order.unitPrice || 0) * (order.quantity || 1);
    const discount = order.discount || 0;
    const total = order.finalPrice || (subtotal - discount);

    card.innerHTML = `
      <div class="cart-order-card__header">
        <div class="cart-order-card__title-row">
          <h3 class="cart-order-card__title">Order ${order.id}</h3>
          <span class="cart-order-card__date">${formatDate(order.createdAt)}</span>
        </div>
        <button type="button" class="cart-order-card__delete" data-order-id="${order.id}" aria-label="Delete order">×</button>
      </div>
      <div class="cart-order-card__body">
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Product:</span>
          <span class="cart-order-card__value">${order.productName || order.name || '—'}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Cylinder Type:</span>
          <span class="cart-order-card__value">${order.cylinderType === 'commercial' ? 'Commercial' : 'Domestic'}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Quantity:</span>
          <span class="cart-order-card__value">${order.quantity || 1}</span>
        </div>
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Unit Price:</span>
          <span class="cart-order-card__value">${formatPKR(order.unitPrice || 0)}</span>
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
          <span class="cart-order-card__value">${formatPKR(discount)} ${order.couponCode ? `(${order.couponCode})` : ''}</span>
        </div>
        ` : ''}
        <div class="cart-order-card__row">
          <span class="cart-order-card__label">Coupon:</span>
          <span class="cart-order-card__value">${order.couponCode || 'No coupon'}</span>
        </div>
        <div class="cart-order-card__row cart-order-card__row--total">
          <span class="cart-order-card__label">Total:</span>
          <span class="cart-order-card__value cart-order-card__value--total">${formatPKR(total)}</span>
        </div>
      </div>
    `;

    // Add delete button handler
    const deleteBtn = card.querySelector('.cart-order-card__delete');
    if (deleteBtn && window.OrderStorage) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this order?')) {
          window.OrderStorage.deleteOrder(order.id);
          loadOrders();
        }
      });
    }

    return card;
  };

  const loadOrders = () => {
    if (!window.OrderStorage) {
      console.error('OrderStorage not available');
      return;
    }

    const orders = window.OrderStorage.getAllOrders();

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
      // Initial load check for orders
      if (window.OrderStorage) {
        const orderCount = window.OrderStorage.getOrderCount();
        const miniCartBtn = document.getElementById('order-mini-cart');
        if (miniCartBtn && orderCount > 0) {
          miniCartBtn.classList.remove('is-hidden');
        }
      }
    });
  } else {
    handleHashChange();
    // Initial load check for orders
    if (window.OrderStorage) {
      const orderCount = window.OrderStorage.getOrderCount();
      const miniCartBtn = document.getElementById('order-mini-cart');
      if (miniCartBtn && orderCount > 0) {
        miniCartBtn.classList.remove('is-hidden');
      }
    }
  }

  window.addEventListener('hashchange', handleHashChange);

  // Expose globally
  window.openCartPage = openCartPage;
  window.loadCartOrders = loadOrders;
})();

