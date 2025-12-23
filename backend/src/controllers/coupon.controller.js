const Coupon = require("../models/coupon.model");
const CouponUsage = require("../models/couponUsage.model");

/**
 * Validate coupon code
 * POST /api/coupons/validate
 * 
 * Request body:
 * {
 *   code: string (required),
 *   subtotal: number (required),
 *   cylinderType: string (required) - 'Domestic' or 'Commercial'
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     code: string,
 *     kind: 'percent' | 'flat',
 *     discountPercent?: number,
 *     discountAmount: number
 *   }
 * }
 */
const validateCouponCode = async (req, res, next) => {
  try {
    const { code, subtotal, cylinderType } = req.body;

    // Validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }

    if (!subtotal || typeof subtotal !== 'number' || subtotal <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid subtotal is required'
      });
    }

    if (!cylinderType || !['Domestic', 'Commercial'].includes(cylinderType)) {
      return res.status(400).json({
        success: false,
        error: 'Valid cylinder type is required (Domestic or Commercial)'
      });
    }

    // Normalize coupon code to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Find coupon in database
    const coupon = await Coupon.findOne({
      where: {
        code: normalizedCode,
        isActive: true
      }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired coupon code'
      });
    }

    // Check expiry date
    if (coupon.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(coupon.expiryDate);
      if (expiry < today) {
        return res.status(400).json({
          success: false,
          error: 'Coupon has expired'
        });
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount of ₨${parseFloat(coupon.minOrderAmount).toLocaleString()} required for this coupon`
      });
    }

    // Check applicable cylinder type
    if (coupon.applicableCylinderType !== 'Both' && coupon.applicableCylinderType !== cylinderType) {
      return res.status(400).json({
        success: false,
        error: `This coupon is not applicable for ${cylinderType} cylinders`
      });
    }

    // Enforce usage limit
    const usedCount = await CouponUsage.count({
      where: { couponCode: normalizedCode },
    });

    const limit = coupon.usageLimit ? parseInt(coupon.usageLimit, 10) : 100;
    if (usedCount >= limit) {
      return res.status(400).json({
        success: false,
        error: 'Coupon usage limit reached',
      });
    }

    // Calculate discount
    const discountValue = parseFloat(coupon.discountValue);
    let discountAmount = 0;
    let discountPercent = undefined;

    if (coupon.discountType === 'percentage') {
      discountPercent = discountValue;
      discountAmount = Math.round((subtotal * discountValue) / 100);
    } else {
      // Flat discount
      discountAmount = Math.min(subtotal, discountValue);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        kind: coupon.discountType === 'percentage' ? 'percent' : 'flat',
        discountPercent: discountPercent,
        discountAmount: Math.round(discountAmount)
      }
    });

  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate coupon. Please try again.'
    });
  }
};

module.exports = {
  validateCouponCode,
};

