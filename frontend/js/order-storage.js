(() => {
  'use strict';

  /**
   * Order Storage Manager
   * Handles persisting orders to localStorage
   */
  const OrderStorage = (() => {
    const STORAGE_KEY = 'lpg_orders';
    const MAX_ORDERS = 100; // Limit stored orders

    const getOrders = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to load orders from storage:', e);
        return [];
      }
    };

    const saveOrders = (orders) => {
      try {
        // Keep only the most recent orders
        const limited = orders.slice(-MAX_ORDERS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        return true;
      } catch (e) {
        console.error('Failed to save orders to storage:', e);
        return false;
      }
    };

    return {
      /**
       * Save a new order
       * @param {Object} orderData - Order data to save
       * @returns {string} Order ID
       */
      saveOrder: (orderData) => {
        const orders = getOrders();
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const order = {
          id: orderId,
          ...orderData,
          createdAt: new Date().toISOString(),
          timestamp: Date.now()
        };
        orders.push(order);
        saveOrders(orders);
        return orderId;
      },

      /**
       * Get all orders (sorted by newest first)
       */
      getAllOrders: () => {
        const orders = getOrders();
        return orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      },

      /**
       * Get a specific order by ID
       */
      getOrder: (orderId) => {
        const orders = getOrders();
        return orders.find(o => o.id === orderId);
      },

      /**
       * Delete an order
       */
      deleteOrder: (orderId) => {
        const orders = getOrders();
        const filtered = orders.filter(o => o.id !== orderId);
        return saveOrders(filtered);
      },

      /**
       * Clear all orders
       */
      clearAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
          return true;
        } catch (e) {
          console.error('Failed to clear orders:', e);
          return false;
        }
      },

      /**
       * Get order count
       */
      getOrderCount: () => {
        return getOrders().length;
      }
    };
  })();

  // Expose globally
  window.OrderStorage = OrderStorage;
})();

