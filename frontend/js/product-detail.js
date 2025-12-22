(() => {
  'use strict';

  // ============================================
  // PRODUCT DATA - Fetched from API
  // ============================================
  // Product data is now fetched from backend API
  // See fetchProduct function below

  // ============================================
  // GLOBAL CART STATE MANAGER
  // ============================================
  const CartManager = (() => {
    const STORAGE_KEY = 'lpg_cart_v1';

    let cart = {
      items: [],
      totalItems: 0,
      subtotal: 0
    };

    const listeners = [];

    const notifyListeners = () => {
      listeners.forEach(listener => listener(cart));
    };

    const calculateTotals = () => {
      // Defensive check: ensure cart.items exists and is an array
      if (!Array.isArray(cart.items)) {
        cart.items = [];
      }
      cart.totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      cart.subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    };

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        if (!Array.isArray(parsed.items)) return;

        // Normalize items to expected shape
        cart.items = parsed.items
          .filter((it) => it && typeof it === 'object')
          .map((it) => {
            const quantity = Math.max(1, parseInt(it.quantity, 10) || 1);
            const unitPrice = Number(it.unitPrice) || 0;
            const totalPrice = unitPrice * quantity;
            return {
              itemId: String(it.itemId || ''),
              id: it.id,
              name: String(it.name || 'Product'),
              type: String(it.type || 'domestic'),
              variant: String(it.variant || 'default'),
              unitPrice,
              quantity,
              totalPrice,
              meta: (it.meta && typeof it.meta === 'object') ? it.meta : {}
            };
          })
          .filter((it) => !!it.itemId);

        calculateTotals();
      } catch (e) {
        console.warn('Failed to load cart from storage:', e);
      }
    };

    const saveToStorage = () => {
      try {
        const payload = {
          items: Array.isArray(cart.items) ? cart.items : [],
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save cart to storage:', e);
      }
    };

    const generateItemId = (productId, type, variant) => {
      return `${productId}-${type}-${variant || 'default'}`;
    };

    // Hydrate cart once on module load
    loadFromStorage();

    return {
      getCart: () => ({ ...cart }),
      
      subscribe: (listener) => {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index > -1) listeners.splice(index, 1);
        };
      },

      addItem: (item) => {
        // Defensive check: ensure cart.items exists and is an array
        if (!Array.isArray(cart.items)) {
          cart.items = [];
        }
        const itemId = generateItemId(item.id, item.type, item.variant);
        const existingIndex = cart.items.findIndex(i => i.itemId === itemId);

        if (existingIndex > -1) {
          // Increment quantity
          cart.items[existingIndex].quantity += item.quantity;
          cart.items[existingIndex].totalPrice = cart.items[existingIndex].unitPrice * cart.items[existingIndex].quantity;
        } else {
          // Add new item
          const newItem = {
            itemId,
            id: item.id,
            name: item.name,
            type: item.type,
            variant: item.variant || 'default',
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.unitPrice * item.quantity,
            meta: item.meta || {}
          };
          cart.items.push(newItem);
        }

        calculateTotals();
        saveToStorage();
        notifyListeners();
        return cart;
      },

      updateItem: (itemId, updates) => {
        // Defensive check: ensure cart.items exists and is an array
        if (!Array.isArray(cart.items)) {
          cart.items = [];
          return false;
        }
        const index = cart.items.findIndex(i => i.itemId === itemId);
        if (index === -1) return false;

        if (updates.quantity !== undefined) {
          cart.items[index].quantity = Math.max(1, updates.quantity);
          cart.items[index].totalPrice = cart.items[index].unitPrice * cart.items[index].quantity;
        }

        if (updates.meta) {
          cart.items[index].meta = { ...cart.items[index].meta, ...updates.meta };
        }

        calculateTotals();
        saveToStorage();
        notifyListeners();
        return true;
      },

      removeItem: (itemId) => {
        // Defensive check: ensure cart.items exists and is an array
        if (!Array.isArray(cart.items)) {
          cart.items = [];
          return false;
        }
        const index = cart.items.findIndex(i => i.itemId === itemId);
        if (index === -1) return false;

        cart.items.splice(index, 1);
        calculateTotals();
        saveToStorage();
        notifyListeners();
        return true;
      },

      clearCart: () => {
        cart = { items: [], totalItems: 0, subtotal: 0 };
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          // ignore
        }
        notifyListeners();
      }
    };
  })();

  // ============================================
  // API FUNCTIONS
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
        description: 'Perfect for home use - safe, reliable, and efficient. Our domestic LPG cylinders are designed for everyday household cooking and heating needs. These cylinders are manufactured with the highest safety standards and are ISI certified, ensuring you get a quality product that you can trust for your family\'s daily cooking requirements. With a standard 45kg capacity, these cylinders provide long-lasting fuel supply while being easy to handle and store in your home.',
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
        description: 'Ideal for businesses and commercial establishments. High-capacity cylinders designed for restaurants, hotels, and industrial use. These commercial-grade LPG cylinders are built to handle heavy usage and provide reliable fuel supply for your business operations. With superior construction and safety features, these cylinders are perfect for establishments that require consistent and large volumes of LPG for their daily operations.',
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

  // ============================================
  const fetchProduct = async (id) => {
    // Handle null/undefined productId
    if (!id) {
      const staticProduct = getStaticProduct('domestic');
      return staticProduct;
    }

    // Map category keys to numeric IDs before API call
    const mappedId = mapProductIdToNumeric(id);
    if (!mappedId) {
      console.warn('Invalid product ID, using static product:', id);
      const staticProduct = getStaticProduct(id);
      return staticProduct || getStaticProduct('domestic'); // Return static product as failsafe
    }

    // Determine category key for static product fallback
    const categoryKey = String(id).toLowerCase();
    const staticProduct = getStaticProduct(categoryKey) || getStaticProduct('domestic');

    try {
      // Use centralized API config if available, otherwise use default
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
        id: product.id || mappedId,
        name: product.name || fallbackStaticProduct.name,
        type: type,
        category: product.category || fallbackStaticProduct.category,
        description: product.description || fallbackStaticProduct.description,
        image: product.imageUrl || fallbackStaticProduct.image,
        price: product.price || fallbackStaticProduct.price,
        inStock: product.inStock !== false, // Explicit check
        specs: fallbackStaticProduct.specs
      };
    } catch (error) {
      console.warn('Error fetching product, using static product:', error);
      return staticProduct; // Return static product as failsafe instead of null
    }
  };

  const mockAddToCart = async (payload) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return CartManager.addItem(payload);
  };

  // ============================================
  // PRODUCT DETAIL PAGE
  // ============================================
  const productDetailLayer = document.getElementById('product-detail-layer');
  const productDetailBackdrop = productDetailLayer?.querySelector('[data-product-detail-backdrop]');
  const productDetailClose = document.getElementById('product-detail-close');
  const productDetailImg = document.getElementById('product-detail-img');
  const productDetailTitle = document.getElementById('product-detail-title');
  const productDetailDescription = document.getElementById('product-detail-description');
  const productDetailPriceValue = document.getElementById('product-detail-price-value');
  const productDetailAddCart = document.getElementById('product-detail-add-cart');

  // Order form elements
  const productOrderForm = document.getElementById('product-order-form');
  const productOrderId = document.getElementById('product-order-id');
  const productOrderType = document.getElementById('product-order-type');
  const productOrderName = document.getElementById('product-order-name');
  const productOrderCylinderType = document.getElementById('product-order-cylinder-type');
  const productOrderQuantity = document.getElementById('product-order-quantity');
  const productOrderQuantityDecrease = productOrderForm?.querySelector('.quantity-btn--decrease');
  const productOrderQuantityIncrease = productOrderForm?.querySelector('.quantity-btn--increase');
  const productOrderCoupon = document.getElementById('product-order-coupon');
  const productOrderCouponApply = document.getElementById('product-order-coupon-apply');
  const productOrderErrCoupon = document.getElementById('product-order-err-coupon');
  const productOrderUnitPrice = document.getElementById('product-order-unit-price');
  const productOrderQtyDisplay = document.getElementById('product-order-qty-display');
  const productOrderSubtotal = document.getElementById('product-order-subtotal');
  const productOrderDiscountRow = document.getElementById('product-order-discount-row');
  const productOrderDiscountLabel = document.getElementById('product-order-discount-label');
  const productOrderDiscountValue = document.getElementById('product-order-discount-value');
  const productOrderTotalPrice = document.getElementById('product-order-total-price');
  const productOrderSubmit = productOrderForm?.querySelector('.product-order-submit');

  // Toast elements
  const cartToast = document.getElementById('cart-toast');
  const cartToastMessage = document.getElementById('cart-toast-message');
  const cartToastView = document.getElementById('cart-toast-view');

  let currentProduct = null;
  let lastFocused = null;

  /** @type {{ status: 'idle'|'checking'|'applied'|'invalid', code: string, kind?: 'percent'|'flat', value?: number }} */
  let couponState = { status: 'idle', code: '' };

  const formatPKR = (amount) => {
    return `₨${amount.toLocaleString('en-PK')}`;
  };

  const setPlainError = (errorEl, message) => {
    if (errorEl) errorEl.textContent = message || '';
  };

  const isOpen = () => {
    return productDetailLayer?.getAttribute('aria-hidden') === 'false';
  };

  const openProductDetail = async (productId) => {
    if (!productDetailLayer) return;

    // Fetch product data
    const product = await fetchProduct(productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    currentProduct = product;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Check stock status
    const isOutOfStock = product.inStock === false;

    // Populate left panel with real product data
    if (productDetailImg) {
      productDetailImg.src = product.image || '';
      productDetailImg.alt = product.name || 'Product image';
      // Apply grayscale filter if out of stock
      if (isOutOfStock) {
        productDetailImg.style.filter = 'grayscale(100%)';
        productDetailImg.style.opacity = '0.6';
      } else {
        productDetailImg.style.filter = '';
        productDetailImg.style.opacity = '';
      }
    }
    // Safe HTML escaping helper
    const escapeHtml = (str) => {
      if (typeof str !== 'string') str = String(str);
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return str.replace(/[&<>"']/g, (m) => map[m]);
    };
    
    if (productDetailTitle) {
      const safeName = escapeHtml(product.name || 'Product');
      if (isOutOfStock) {
        // Use textContent for safety, then add span via DOM manipulation
        productDetailTitle.textContent = '';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = safeName;
        productDetailTitle.appendChild(nameSpan);
        const stockSpan = document.createElement('span');
        stockSpan.textContent = ' (Out of Stock)';
        stockSpan.style.color = '#dc2626';
        stockSpan.style.fontSize = '0.8em';
        stockSpan.style.fontWeight = 'normal';
        productDetailTitle.appendChild(stockSpan);
      } else {
        productDetailTitle.textContent = safeName;
      }
    }
    if (productDetailDescription) {
      // Show all product details: Category, Description (safely)
      const safeCategory = escapeHtml(product.category || 'N/A');
      const safeDescription = escapeHtml(product.description || 'No description available.');
      
      // Use DOM manipulation instead of innerHTML
      productDetailDescription.textContent = '';
      
      const categoryDiv = document.createElement('div');
      categoryDiv.style.marginBottom = '1rem';
      categoryDiv.style.padding = '0.75rem';
      categoryDiv.style.background = 'rgba(11, 74, 166, 0.1)';
      categoryDiv.style.borderRadius = '8px';
      categoryDiv.style.borderLeft = '4px solid var(--color-brand)';
      
      const categoryLabel = document.createElement('div');
      categoryLabel.textContent = 'CATEGORY';
      categoryLabel.style.fontSize = '0.875rem';
      categoryLabel.style.color = 'var(--text-700)';
      categoryLabel.style.marginBottom = '0.25rem';
      categoryLabel.style.fontWeight = '500';
      categoryLabel.style.textTransform = 'uppercase';
      categoryLabel.style.letterSpacing = '0.5px';
      
      const categoryValue = document.createElement('div');
      categoryValue.textContent = safeCategory;
      categoryValue.style.fontSize = '1rem';
      categoryValue.style.fontWeight = '600';
      categoryValue.style.color = 'var(--color-brand)';
      
      categoryDiv.appendChild(categoryLabel);
      categoryDiv.appendChild(categoryValue);
      productDetailDescription.appendChild(categoryDiv);
      
      const descDiv = document.createElement('div');
      descDiv.style.marginBottom = '1rem';
      
      const descLabel = document.createElement('div');
      descLabel.textContent = 'DESCRIPTION';
      descLabel.style.fontSize = '0.875rem';
      descLabel.style.color = 'var(--text-700)';
      descLabel.style.marginBottom = '0.5rem';
      descLabel.style.fontWeight = '500';
      descLabel.style.textTransform = 'uppercase';
      descLabel.style.letterSpacing = '0.5px';
      
      const descText = document.createElement('p');
      descText.textContent = safeDescription;
      descText.style.lineHeight = '1.7';
      descText.style.color = 'var(--text-600)';
      
      descDiv.appendChild(descLabel);
      descDiv.appendChild(descText);
      productDetailDescription.appendChild(descDiv);
    }
    if (productDetailPriceValue) {
      // Show price with label (safely)
      productDetailPriceValue.textContent = '';
      
      const priceLabel = document.createElement('div');
      priceLabel.textContent = 'Price (PKR)';
      priceLabel.style.fontSize = '0.875rem';
      priceLabel.style.color = 'var(--text-700)';
      priceLabel.style.marginBottom = '0.25rem';
      priceLabel.style.fontWeight = '500';
      
      const priceValue = document.createElement('div');
      priceValue.textContent = formatPKR(product.price || 0);
      priceValue.style.fontSize = '1.5rem';
      priceValue.style.fontWeight = '700';
      priceValue.style.color = 'var(--color-brand)';
      
      productDetailPriceValue.appendChild(priceLabel);
      productDetailPriceValue.appendChild(priceValue);
    }

    // Populate order form
    if (productOrderId) productOrderId.value = product.id || '';
    if (productOrderType) productOrderType.value = product.type || '';
    if (productOrderName) productOrderName.value = product.name || '';
    if (productOrderCylinderType) {
      productOrderCylinderType.value = product.type === 'domestic' ? 'domestic' : 'commercial';
    }
    if (productOrderQuantity) productOrderQuantity.value = '1';

    // Reset coupon state
    couponState = { status: 'idle', code: '' };
    if (productOrderCoupon) productOrderCoupon.value = '';
    if (productOrderErrCoupon) setPlainError(productOrderErrCoupon, '');

    // Handle out of stock - disable buy buttons
    if (productDetailAddCart) {
      if (isOutOfStock) {
        productDetailAddCart.disabled = true;
        productDetailAddCart.textContent = 'Out of Stock';
        productDetailAddCart.classList.add('btn--disabled');
        productDetailAddCart.style.opacity = '0.6';
        productDetailAddCart.style.cursor = 'not-allowed';
      } else {
        productDetailAddCart.disabled = false;
        productDetailAddCart.textContent = 'Add to Cart';
        productDetailAddCart.classList.remove('btn--disabled');
        productDetailAddCart.style.opacity = '';
        productDetailAddCart.style.cursor = '';
      }
    }

    // Disable order form if out of stock
    if (productOrderForm) {
      const formInputs = productOrderForm.querySelectorAll('input, select, textarea, button[type="submit"]');
      formInputs.forEach(input => {
        if (input.type !== 'hidden') {
          input.disabled = isOutOfStock;
        }
      });
      const submitBtn = productOrderForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (isOutOfStock) {
          submitBtn.textContent = 'Out of Stock';
          submitBtn.classList.add('btn--disabled');
          submitBtn.style.opacity = '0.6';
          submitBtn.style.cursor = 'not-allowed';
        } else {
          submitBtn.textContent = 'Place Order';
          submitBtn.classList.remove('btn--disabled');
          submitBtn.style.opacity = '';
          submitBtn.style.cursor = '';
        }
      }
    }

    // Update price summary and button states
    window.requestAnimationFrame(() => {
      updatePriceSummary();
    });

    // Show product detail page
    productDetailLayer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-detail-open');
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const firstFocusable = productDetailClose || productDetailAddCart;
    if (firstFocusable) {
      window.requestAnimationFrame(() => firstFocusable.focus());
    }

    // Trap focus
    document.addEventListener('keydown', handleKeyDown);
  };

  const closeProductDetail = () => {
    if (!productDetailLayer || !isOpen()) return;

    productDetailLayer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('product-detail-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeyDown);

    // Reset form
    if (productOrderForm) productOrderForm.reset();
    currentProduct = null;

    // Restore focus
    if (lastFocused instanceof HTMLElement) {
      const style = window.getComputedStyle(lastFocused);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        window.requestAnimationFrame(() => lastFocused.focus());
      }
    }
    lastFocused = null;
  };

  const handleKeyDown = (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeProductDetail();
    }
  };

  const calculateTotals = () => {
    if (!currentProduct) return { subtotal: 0, discount: 0, discountPct: 0, finalTotal: 0 };

    const quantity = parseInt(productOrderQuantity?.value || '1', 10);
    const unitPrice = currentProduct.price;
    const subtotal = unitPrice * quantity;

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
    return { subtotal, discount, discountPct, finalTotal };
  };

  const updatePriceSummary = () => {
    if (!currentProduct) return;

    const quantity = parseInt(productOrderQuantity?.value || '1', 10);
    const unitPrice = currentProduct.price;
    const totals = calculateTotals();

    if (productOrderUnitPrice) productOrderUnitPrice.textContent = formatPKR(unitPrice);
    if (productOrderQtyDisplay) productOrderQtyDisplay.textContent = String(quantity);
    if (productOrderSubtotal) productOrderSubtotal.textContent = formatPKR(totals.subtotal);

    // Update discount row
    const hasDiscount = totals.discount > 0 && couponState.status === 'applied';
    if (productOrderDiscountRow) {
      productOrderDiscountRow.classList.toggle('is-hidden', !hasDiscount);
    }
    if (hasDiscount && productOrderDiscountLabel && productOrderDiscountValue) {
      productOrderDiscountLabel.textContent = 'Discount:';
      productOrderDiscountValue.textContent = `${formatPKR(totals.discount)} (${totals.discountPct}%)`;
    }

    // Update final total (strike through subtotal if discount applied)
    if (productOrderTotalPrice) {
      productOrderTotalPrice.textContent = formatPKR(totals.finalTotal);
      // Optionally add strike-through class to subtotal if discount applied
      if (productOrderSubtotal) {
        productOrderSubtotal.parentElement?.classList.toggle('is-struck', hasDiscount);
      }
    }

    // Update quantity button states
    if (productOrderQuantityDecrease) {
      productOrderQuantityDecrease.disabled = quantity <= 1;
    }
    if (productOrderQuantityIncrease) {
      productOrderQuantityIncrease.disabled = quantity >= 999;
    }
  };

  const applyCoupon = async () => {
    if (!productOrderCoupon || !productOrderCouponApply || !currentProduct) return;

    const code = productOrderCoupon.value.trim().toUpperCase();
    productOrderCoupon.value = code;

    // Clear coupon state if user empties the field
    if (!code) {
      couponState = { status: 'idle', code: '' };
      setPlainError(productOrderErrCoupon, '');
      updatePriceSummary();
      return;
    }

    // Calculate subtotal for validation
    const quantity = parseInt(productOrderQuantity?.value || '1', 10);
    const subtotal = currentProduct.price * quantity;
    
    // Get cylinder type (normalize to 'Domestic' or 'Commercial')
    const cylinderTypeValue = productOrderCylinderType?.value || currentProduct.type || 'domestic';
    const cylinderType = cylinderTypeValue.charAt(0).toUpperCase() + cylinderTypeValue.slice(1).toLowerCase();
    const normalizedCylinderType = cylinderType === 'Commercial' ? 'Commercial' : 'Domestic';

    couponState = { status: 'checking', code };
    setPlainError(productOrderErrCoupon, '');
    productOrderCouponApply.disabled = true;
    const prevLabel = productOrderCouponApply.textContent;
    productOrderCouponApply.textContent = 'Applying…';

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
        setPlainError(productOrderErrCoupon, '');
        
        // Show toast for successful coupon application
        const discountText = couponData.kind === 'percent' 
          ? `${couponData.discountPercent}% off` 
          : formatPKR(couponData.discountAmount) + ' off';
        showToast(`Coupon applied! ${discountText}`, false);
      } else {
        couponState = { status: 'invalid', code };
        setPlainError(productOrderErrCoupon, data.error || 'Invalid coupon code.');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      couponState = { status: 'invalid', code };
      setPlainError(productOrderErrCoupon, 'Failed to validate coupon. Please try again.');
    }

    productOrderCouponApply.disabled = false;
    productOrderCouponApply.textContent = prevLabel || 'Apply';

    // If invalid, remove discounts from totals (but keep the code visible)
    if (couponState.status !== 'applied') {
      couponState = { status: 'idle', code: couponState.code };
    }

    updatePriceSummary();
  };

  const showToast = (message, showViewButton = false) => {
    if (!cartToast || !cartToastMessage) return;

    cartToastMessage.textContent = message;
    if (cartToastView) {
      cartToastView.style.display = showViewButton ? 'block' : 'none';
    }

    cartToast.classList.add('is-visible');

    setTimeout(() => {
      cartToast.classList.remove('is-visible');
    }, 3000);
  };

  const addToCartFromProductPanel = async () => {
    if (!currentProduct) return;

    // Check stock before adding to cart
    if (currentProduct.inStock === false) {
      showToast('This product is currently out of stock.', false);
      return;
    }

    const quantity = 1; // Default quantity from product panel

    try {
      await mockAddToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        type: currentProduct.type,
        unitPrice: currentProduct.price,
        quantity: quantity,
        variant: 'default'
      });

      const cart = CartManager.getCart();
      showToast(`Added 1 x ${currentProduct.name} — Cart (${cart.totalItems})`, true);

      // Update cart indicators (integrate with existing cart system)
      updateCartIndicators();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast('Failed to add item to cart. Please try again.');
    }
  };

  const addToCartFromForm = async (formData) => {
    if (!currentProduct) return;

    // Check stock before adding to cart
    if (currentProduct.inStock === false) {
      showToast('This product is currently out of stock and cannot be purchased.', false);
      return;
    }

    const quantity = parseInt(formData.get('quantity') || '1', 10);
    const cylinderType = formData.get('cylinderType') || currentProduct.type;
    const totals = calculateTotals();
    const couponCode = couponState.status === 'applied' ? couponState.code : null;

    try {
      await mockAddToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        type: cylinderType,
        unitPrice: currentProduct.price,
        quantity: quantity,
        variant: 'default',
        meta: {
          address: formData.get('address'),
          contactName: formData.get('contactName'),
          contactPhone: formData.get('contactPhone'),
          deliveryDate: formData.get('deliveryDate'),
          instructions: formData.get('instructions'),
          couponCode: couponCode,
          discount: totals.discount,
          discountPct: totals.discountPct,
          subtotal: totals.subtotal,
          finalTotal: totals.finalTotal
        }
      });

      const cart = CartManager.getCart();
      const couponText = couponCode ? ` (Coupon: ${couponCode})` : '';
      showToast(`Added ${quantity} x ${currentProduct.name}${couponText} — View Cart`, true);

      // Update cart indicators
      updateCartIndicators();

      // Close product detail and optionally open cart
      closeProductDetail();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast('Failed to add item to cart. Please try again.');
    }
  };

  const updateCartIndicators = () => {
    const cart = CartManager.getCart();
    const hasItems = cart.totalItems > 0;

    // Update existing cart indicators from order.js
    const navCartDot = document.getElementById('nav-cart-dot');
    const miniCartBtn = document.getElementById('order-mini-cart');
    const miniCartDot = miniCartBtn?.querySelector('.order-mini-cart__dot');

    if (navCartDot) navCartDot.classList.toggle('is-active', hasItems);
    if (miniCartDot) miniCartDot.classList.toggle('is-active', hasItems);

    // Update sidecard if it's open
    if (typeof window.updateSidecardFromCart === 'function') {
      window.updateSidecardFromCart();
    }
  };

  // ============================================
  // EVENT LISTENERS
  // ============================================

  // Product card clicks - DISABLED: Now using View Description and Buy Now buttons instead
  // const productCards = document.querySelectorAll('.product-card[data-product-id]');
  // productCards.forEach(card => {
  //   card.addEventListener('click', (e) => {
  //     const productId = card.getAttribute('data-product-id');
  //     if (productId) {
  //       openProductDetail(productId);
  //     }
  //   });
  // });

  // Close button
  if (productDetailClose) {
    productDetailClose.addEventListener('click', closeProductDetail);
  }

  // Backdrop click
  if (productDetailBackdrop) {
    productDetailBackdrop.addEventListener('click', (e) => {
      if (e.target === productDetailBackdrop) {
        closeProductDetail();
      }
    });
  }

  // Add to cart from product panel
  if (productDetailAddCart) {
    productDetailAddCart.addEventListener('click', addToCartFromProductPanel);
  }

  // Quantity stepper
  if (productOrderQuantityDecrease) {
    productOrderQuantityDecrease.addEventListener('click', () => {
      const current = parseInt(productOrderQuantity?.value || '1', 10);
      if (current > 1) {
        productOrderQuantity.value = String(current - 1);
        updatePriceSummary();
      }
    });
  }

  if (productOrderQuantityIncrease) {
    productOrderQuantityIncrease.addEventListener('click', () => {
      const current = parseInt(productOrderQuantity?.value || '1', 10);
      if (current < 999) {
        productOrderQuantity.value = String(current + 1);
        updatePriceSummary();
      }
    });
  }

  if (productOrderQuantity) {
    productOrderQuantity.addEventListener('input', updatePriceSummary);
    productOrderQuantity.addEventListener('change', updatePriceSummary);
  }

  // Coupon apply button
  if (productOrderCouponApply) {
    productOrderCouponApply.addEventListener('click', applyCoupon);
  }

  // Coupon input keydown (Enter to apply)
  if (productOrderCoupon) {
    productOrderCoupon.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyCoupon();
      }
    });

    // Clear coupon on input change (optional - can be removed if you want to keep code visible)
    productOrderCoupon.addEventListener('input', () => {
      if (couponState.status === 'applied' && productOrderCoupon.value.trim().toUpperCase() !== couponState.code) {
        couponState = { status: 'idle', code: '' };
        setPlainError(productOrderErrCoupon, '');
        updatePriceSummary();
      }
    });
  }

  // Form submission
  if (productOrderForm) {
    productOrderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!productOrderSubmit) return;

      // Basic validation
      const formData = new FormData(productOrderForm);
      const address = formData.get('address');
      const contactName = formData.get('contactName');
      const contactPhone = formData.get('contactPhone');
      const cylinderType = formData.get('cylinderType');

      if (!address || !contactName || !contactPhone || !cylinderType) {
        showToast('Please fill in all required fields.');
        return;
      }

      // Disable submit button
      productOrderSubmit.disabled = true;
      productOrderSubmit.textContent = 'Adding to Cart...';

      try {
        await addToCartFromForm(formData);
      } finally {
        productOrderSubmit.disabled = false;
        productOrderSubmit.textContent = 'Add to Cart & Checkout';
      }
    });
  }

  // Toast view cart button
  if (cartToastView) {
    cartToastView.addEventListener('click', () => {
      // Open existing cart sidecard
      if (typeof window.openSidecard === 'function') {
        window.openSidecard();
      } else {
        // Fallback: trigger cart button click
        const navCartBtn = document.getElementById('nav-cart-btn');
        const miniCartBtn = document.getElementById('order-mini-cart');
        const cartBtn = window.innerWidth > 768 ? navCartBtn : miniCartBtn;
        if (cartBtn) cartBtn.click();
      }
    });
  }

  // Subscribe to cart changes to update indicators
  CartManager.subscribe(() => {
    updateCartIndicators();
  });

  // Expose CartManager globally for integration with existing order.js
  window.CartManager = CartManager;
  window.openProductDetail = openProductDetail;

  // Ensure indicators are correct on initial load (after storage hydration)
  updateCartIndicators();
})();

