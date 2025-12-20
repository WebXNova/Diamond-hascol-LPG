const Product = require("../models/product.model");
const Coupon = require("../models/coupon.model");
const CouponUsage = require("../models/couponUsage.model");

/**
 * Calculate order total with server-side pricing
 * @param {string} cylinderType - 'Domestic' or 'Commercial'
 * @param {number} quantity - Quantity of cylinders
 * @param {string|null} couponCode - Optional coupon code
 * @returns {Promise<Object>} - { pricePerCylinder, subtotal, discount, total }
 */
async function calculateOrderTotal(cylinderType, quantity, couponCode = null) {
  // Fetch product price from database
  const product = await Product.findOne({
    where: {
      type: cylinderType, // 'Domestic' or 'Commercial'
      isActive: true,
    },
  });

  if (!product) {
    throw new Error(`Product not found for type: ${cylinderType}`);
  }

  const pricePerCylinder = parseFloat(product.price);
  const subtotal = Math.round(pricePerCylinder * quantity * 100) / 100;

  // Apply coupon if provided
  let discount = 0;
  let couponDetails = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      where: {
        code: couponCode.toUpperCase().trim(),
      },
    });

    if (coupon) {
      couponDetails = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
      };

      // Calculate discount based on coupon type
      if (coupon.discountType === "percentage") {
        discount = Math.round((subtotal * parseFloat(coupon.discountValue)) / 100 * 100) / 100;
      } else if (coupon.discountType === "flat") {
        discount = Math.min(subtotal, parseFloat(coupon.discountValue));
      }
    }
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
 * Validate coupon for an order
 * @param {string} couponCode - Coupon code
 * @param {string} cylinderType - 'Domestic' or 'Commercial'
 * @param {number} subtotal - Order subtotal
 * @returns {Promise<Object>} - Validation result with discount
 */
async function validateCoupon(couponCode, cylinderType, subtotal) {
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

  // Check if coupon is active
  if (!coupon.isActive) {
    return {
      valid: false,
      error: "Coupon is not active",
    };
  }

  // Check expiry date
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

  // Check applicable cylinder type
  if (
    coupon.applicableCylinderType !== "Both" &&
    coupon.applicableCylinderType !== cylinderType
  ) {
    return {
      valid: false,
      error: "Coupon not applicable for this cylinder type",
    };
  }

  // Check minimum order amount
  if (coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order amount of ${coupon.minOrderAmount} required`,
      minOrderAmount: parseFloat(coupon.minOrderAmount),
      currentSubtotal: subtotal,
    };
  }

  // Check if coupon already used (one-time rule)
  const existingUsage = await CouponUsage.findOne({
    where: { couponCode: code },
  });

  if (existingUsage) {
    return {
      valid: false,
      error: "Coupon has already been used",
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((subtotal * parseFloat(coupon.discountValue)) / 100 * 100) / 100;
  } else if (coupon.discountType === "flat") {
    discountAmount = Math.min(subtotal, parseFloat(coupon.discountValue));
  }

  const newTotal = Math.round((subtotal - discountAmount) * 100) / 100;

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue),
    },
    discountAmount,
    newTotal,
  };
}

module.exports = {
  calculateOrderTotal,
  validateCoupon,
};
