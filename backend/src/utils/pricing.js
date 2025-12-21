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
  // Default prices (fallback if products table doesn't exist)
  const defaultPrices = {
    'Domestic': 2500.00,
    'Commercial': 3000.00
  };
  
  let pricePerCylinder;
  
  // Try to fetch product price from database
  try {
    const product = await Product.findOne({
      where: {
        category: cylinderType, // 'Domestic' or 'Commercial'
      },
    });

    if (product && product.price) {
      pricePerCylinder = parseFloat(product.price);
    } else {
      // Use default price if product not found
      pricePerCylinder = defaultPrices[cylinderType] || 2500.00;
      console.log(`⚠️  Product not found in database for category: ${cylinderType}, using default price: ${pricePerCylinder}`);
    }
  } catch (dbError) {
    // If products table doesn't exist, use default prices
    pricePerCylinder = defaultPrices[cylinderType] || 2500.00;
    console.log(`⚠️  Products table error, using default price for category ${cylinderType}: ${pricePerCylinder}`);
  }
  
  if (!pricePerCylinder || pricePerCylinder <= 0) {
    throw new Error(`Invalid price for cylinder category: ${cylinderType}`);
  }

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
      // Validate coupon discount value
      const discountValue = parseFloat(coupon.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        throw new Error('Invalid coupon discount value');
      }
      
      couponDetails = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: discountValue,
      };

      // Calculate discount based on coupon type
      if (coupon.discountType === "percentage") {
        discount = Math.round((subtotal * discountValue) / 100 * 100) / 100;
      } else if (coupon.discountType === "flat") {
        discount = Math.min(subtotal, discountValue);
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
