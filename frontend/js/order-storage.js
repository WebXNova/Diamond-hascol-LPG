(() => {
  'use strict';

  /**
   * Order ID Storage Manager (Privacy-safe)
   *
   * Rules:
   * - localStorage stores ONLY order IDs (no customer/order details)
   * - We also store the last used orderId for convenience (still only the ID)
   */
  const OrderStorage = (() => {
    const STORAGE_KEY = 'lpg_order_ids_v1';
    const LAST_ORDER_ID_KEY = 'lpg_last_order_id';
    const LEGACY_STORAGE_KEY = 'lpg_orders'; // legacy contained full order objects (PII) - must be removed
    const MAX_ORDERS = 100; // Limit stored IDs

    const normalizeId = (orderId) => {
      const id = String(orderId || '').trim();
      return id ? id : null;
    };

    const getOrderIds = () => {
      try {
        // Migration: if legacy storage exists, extract IDs and wipe legacy data.
        try {
          const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            const parsedLegacy = JSON.parse(legacy);
            if (Array.isArray(parsedLegacy)) {
              const extracted = parsedLegacy
                .map((o) => {
                  if (!o) return null;
                  // common legacy shapes: { id: 'ORD-...' } or { orderId: 123 }
                  return normalizeId(o.orderId || o.id);
                })
                .filter(Boolean);
              // Persist extracted IDs in the new key, then remove legacy key to purge PII.
              if (extracted.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(extracted.slice(-MAX_ORDERS)));
              }
            }
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          }
        } catch (e) {
          // If legacy parsing fails, still remove legacy to avoid retaining sensitive data.
          try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (_) {}
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeId).filter(Boolean);
      } catch (e) {
        console.error('Failed to load order IDs from storage:', e);
        return [];
      }
    };

    const saveOrderIds = (orderIds) => {
      try {
        const clean = Array.isArray(orderIds) ? orderIds.map(normalizeId).filter(Boolean) : [];
        // Keep only the most recent IDs
        const limited = clean.slice(-MAX_ORDERS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        return true;
      } catch (e) {
        console.error('Failed to save order IDs to storage:', e);
        return false;
      }
    };

    return {
      /**
       * Add an orderId to local history (stores ONLY the ID)
       * @param {string|number} orderId
       */
      addOrderId: (orderId) => {
        const id = normalizeId(orderId);
        if (!id) return false;

        const ids = getOrderIds();
        // Keep unique, move to end for recency ordering.
        const next = ids.filter((x) => x !== id);
        next.push(id);
        saveOrderIds(next);

        // Convenience: last order ID (still only the ID)
        try { localStorage.setItem(LAST_ORDER_ID_KEY, id); } catch (_) {}
        return true;
      },

      /**
       * Get all order IDs (newest first)
       */
      getAllOrderIds: () => {
        const ids = getOrderIds();
        return ids.slice().reverse();
      },

      /**
       * Get last used orderId (for Track/Details page auto-load)
       */
      getLastOrderId: () => {
        try {
          const v = localStorage.getItem(LAST_ORDER_ID_KEY);
          return normalizeId(v);
        } catch (e) {
          return null;
        }
      },

      /**
       * Remove an orderId from local history
       */
      deleteOrderId: (orderId) => {
        const id = normalizeId(orderId);
        if (!id) return false;
        const ids = getOrderIds();
        const filtered = ids.filter((x) => x !== id);
        return saveOrderIds(filtered);
      },

      /**
       * Clear all locally stored order IDs
       */
      clearAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LAST_ORDER_ID_KEY);
          return true;
        } catch (e) {
          console.error('Failed to clear order IDs:', e);
          return false;
        }
      },

      /**
       * Get order count
       */
      getOrderCount: () => {
        return getOrderIds().length;
      },

      // Backwards-safe aliases (avoid runtime errors if old code calls these)
      saveOrder: (orderId) => OrderStorage.addOrderId(orderId),
      getAllOrders: () => OrderStorage.getAllOrderIds(),
      deleteOrder: (orderId) => OrderStorage.deleteOrderId(orderId),
    };
  })();

  // Expose globally
  window.OrderStorage = OrderStorage;
})();

