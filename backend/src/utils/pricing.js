const Product = require("../models/product.model");
const Coupon = require("../models/coupon.model");
const CouponUsage = require("../models/couponUsage.model");

/**
 * Validate coupon with same rules as /api/coupons/validate endpoint
 * @param {string} couponCode - Coupon code
 * @param {string} cylinderType - 'Domestic' or 'Commercial'
 * @param {number} subtotal - Order subtotal
 * @returns {Promise<Object>} - Validation result with discount
 */
async function validateCouponForOrder(couponCode, cylinderType, subtotal) {
  if (!couponCode || typeof couponCode !== "string") {
    return {
      valid: false,
      error: "Coupon code is required",
    };
  }

  const code = couponCode.toUpperCase().trim();

  // Find coupon
  const coupon = await Coupon.findOne({
    where: {
      code,
    },
  });

  if (!coupon) {
    return {
      valid: false,
      error: "Coupon code not found",
    };
  }

  // Check if coupon is active (same as validate endpoint)
  if (!coupon.isActive) {
    return {
      valid: false,
      error: "Coupon is not active",
    };
  }

  // Check expiry date (same as validate endpoint)
  if (coupon.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(coupon.expiryDate);
    
    if (today > expiryDate) {
      return {
        valid: false,
        error: "Coupon has expired",
      };
    }
  }

  // Check applicable cylinder type (same as validate endpoint)
  if (
    coupon.applicableCylinderType !== "Both" &&
    coupon.applicableCylinderType !== cylinderType
  ) {
    return {
      valid: false,
      error: "Coupon not applicable for this cylinder type",
    };
  }

  // Check minimum order amount (same as validate endpoint)
  if (coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order amount of ${coupon.minOrderAmount} required`,
      minOrderAmount: parseFloat(coupon.minOrderAmount),
      currentSubtotal: subtotal,
    };
  }

  // Enforce usage limit
  const usedCount = await CouponUsage.count({
    where: { couponCode: code },
  });

  const limit = coupon.usageLimit ? parseInt(coupon.usageLimit, 10) : 100;
  if (usedCount >= limit) {
    return {
      valid: false,
      error: "Coupon usage limit reached",
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((subtotal * parseFloat(coupon.discountValue)) / 100 * 100) / 100;
  } else if (coupon.discountType === "flat") {
    discountAmount = Math.min(subtotal, parseFloat(coupon.discountValue));
  }

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue),
    },
    discountAmount,
  };
}

/**
 * Calculate order total with server-side pricing
 * Uses same coupon validation rules as /api/coupons/validate
 * @param {string} cylinderType - 'Domestic' or 'Commercial'
 * @param {number} quantity - Quantity of cylinders
 * @param {string|null} couponCode - Optional coupon code
 * @returns {Promise<Object>} - { pricePerCylinder, subtotal, discount, total }
 */
async function calculateOrderTotal(cylinderType, quantity, couponCode = null) {
  // Fetch product from database - REQUIRED (no defaults, products table is source of truth)
  const product = await Product.findOne({
    where: {
      category: cylinderType, // 'Domestic' or 'Commercial'
    },
  });

  if (!product) {
    throw new Error(`Product not found for category: ${cylinderType}`);
  }

  // ENFORCE STOCK CHECK - Backend must reject out-of-stock products
  if (product.inStock === false || product.inStock === 0) {
    throw new Error(`Product "${product.name}" is currently out of stock. Please check back later.`);
  }

  // Validate price exists and is positive
  const pricePerCylinder = parseFloat(product.price);
  if (!pricePerCylinder || pricePerCylinder <= 0 || isNaN(pricePerCylinder)) {
    throw new Error(`Invalid price for product: ${product.name}`);
  }

  const subtotal = Math.round(pricePerCylinder * quantity * 100) / 100;

  // Apply coupon if provided - use same validation as /api/coupons/validate
  let discount = 0;
  let couponDetails = null;

  if (couponCode) {
    const validation = await validateCouponForOrder(couponCode, cylinderType, subtotal);
    
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid coupon code');
    }

    discount = validation.discountAmount;
    couponDetails = validation.coupon;
  }

  // Calculate final total
  const total = Math.round((subtotal - discount) * 100) / 100;

  return {
    pricePerCylinder,
    subtotal,
    discount,
    total,
    coupon: couponDetails,
  };
}

/**
 * Record coupon usage when order is created
 * @param {string} couponCode - Coupon code
 * @param {number} orderId - Order ID
 * @param {number} discountAmount - Discount amount applied
 */
async function recordCouponUsage(couponCode, orderId, discountAmount) {
  if (!couponCode) return;

  try {
    await CouponUsage.create({
      couponCode: couponCode.toUpperCase().trim(),
      orderId,
      discountAmount,
    });
    console.log(`✅ Recorded coupon usage: ${couponCode} for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to record coupon usage: ${error.message}`);
    // Don't throw - coupon usage recording failure shouldn't break order creation
  }
}

/**
 * Validate coupon for an order (legacy function for backward compatibility)
 * @param {string} couponCode - Coupon code
 * @param {string} cylinderType - 'Domestic' or 'Commercial'
 * @param {number} subtotal - Order subtotal
 * @returns {Promise<Object>} - Validation result with discount
 */
async function validateCoupon(couponCode, cylinderType, subtotal) {
  const result = await validateCouponForOrder(couponCode, cylinderType, subtotal);
  const newTotal = result.valid ? Math.round((subtotal - result.discountAmount) * 100) / 100 : subtotal;
  
  return {
    ...result,
    newTotal,
  };
}

module.exports = {
  calculateOrderTotal,
  validateCoupon,
  recordCouponUsage,
};
