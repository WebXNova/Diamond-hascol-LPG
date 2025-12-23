const Coupon = require("../../models/coupon.model");
const CouponUsage = require("../../models/couponUsage.model");

/**
 * Create a new coupon
 * POST /api/admin/coupons
 */
const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      applicableCylinderType,
      minOrderAmount,
      expiryDate,
      isActive = true,
    } = req.body;
    // Accept both camelCase and snake_case, and tolerate numeric strings
    const rawUsageLimit = req.body.usageLimit ?? req.body.usage_limit;
    const usageLimit =
      rawUsageLimit === undefined || rawUsageLimit === null
        ? undefined
        : typeof rawUsageLimit === "string"
          ? parseInt(rawUsageLimit, 10)
          : rawUsageLimit;

    // Validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required',
      });
    }

    if (!discountType || !['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        error: 'Discount type must be "percentage" or "flat"',
      });
    }

    if (!discountValue || typeof discountValue !== 'number' || discountValue <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Discount value must be a positive number',
      });
    }

    // Validate usage limit (defaults to 100 if not provided)
    const finalUsageLimit = usageLimit === undefined || usageLimit === null ? 100 : usageLimit;
    if (!Number.isInteger(finalUsageLimit) || finalUsageLimit < 1) {
      return res.status(400).json({
        success: false,
        error: 'Usage limit must be an integer >= 1',
      });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage discount cannot exceed 100%',
      });
    }

    if (!applicableCylinderType || !['Domestic', 'Commercial', 'Both'].includes(applicableCylinderType)) {
      return res.status(400).json({
        success: false,
        error: 'Applicable cylinder type must be "Domestic", "Commercial", or "Both"',
      });
    }

    // Normalize code to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Check if coupon already exists
    const existingCoupon = await Coupon.findByPk(normalizedCode);
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        error: 'Coupon code already exists',
      });
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: normalizedCode,
      discountType,
      discountValue,
      applicableCylinderType,
      minOrderAmount: minOrderAmount || null,
      expiryDate: expiryDate || null,
      usageLimit: finalUsageLimit,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        applicableCylinderType: coupon.applicableCylinderType,
        minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : null,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
        usageCount: 0,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error creating coupon:', error);
    next(error);
  }
};

/**
 * Get all coupons
 * GET /api/admin/coupons
 */
const getCoupons = async (req, res, next) => {
  try {
    const { isActive, limit = 100, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    // Fetch coupons from database
    const { Sequelize } = require('sequelize');
    const coupons = await Coupon.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[Sequelize.literal('created_at'), 'DESC']],
    });

    // Format coupons for frontend
    const formattedCoupons = await Promise.all(coupons.map(async coupon => {
      const createdAt = coupon.createdAt || coupon.get('createdAt') || coupon.get('created_at') || new Date();
      const updatedAt = coupon.updatedAt || coupon.get('updatedAt') || coupon.get('updated_at') || new Date();
      const usageCount = await CouponUsage.count({ where: { couponCode: coupon.code } });

      return {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        applicableCylinderType: coupon.applicableCylinderType,
        minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : null,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
        usageCount,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      };
    }));

    return res.status(200).json({
      success: true,
      data: formattedCoupons,
      count: formattedCoupons.length,
    });
  } catch (error) {
    console.error('❌ Error fetching coupons:', error);
    next(error);
  }
};

/**
 * Get coupon by code
 * GET /api/admin/coupons/:code
 */
const getCouponByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required',
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findByPk(normalizedCode);
    const usageCount = await CouponUsage.count({ where: { couponCode: coupon.code } });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    const createdAt = coupon.createdAt || coupon.get('createdAt') || coupon.get('created_at') || new Date();
    const updatedAt = coupon.updatedAt || coupon.get('updatedAt') || coupon.get('updated_at') || new Date();

    return res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        applicableCylinderType: coupon.applicableCylinderType,
        minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : null,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
        usageCount,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching coupon by code:', error);
    next(error);
  }
};

/**
 * Update coupon
 * PATCH /api/admin/coupons/:code
 */
const updateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const {
      discountType,
      discountValue,
      applicableCylinderType,
      minOrderAmount,
      expiryDate,
      isActive,
    } = req.body;
    // Accept both camelCase and snake_case, and tolerate numeric strings
    const rawUsageLimit = req.body.usageLimit ?? req.body.usage_limit;
    const usageLimit =
      rawUsageLimit === undefined || rawUsageLimit === null
        ? undefined
        : typeof rawUsageLimit === "string"
          ? parseInt(rawUsageLimit, 10)
          : rawUsageLimit;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required',
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findByPk(normalizedCode);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    // Validate discount type if provided
    if (discountType && !['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        error: 'Discount type must be "percentage" or "flat"',
      });
    }

    // Validate usage limit if provided
    if (usageLimit !== undefined) {
      if (!Number.isInteger(usageLimit) || usageLimit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Usage limit must be an integer >= 1',
        });
      }
    }

    // Validate discount value if provided
    if (discountValue !== undefined) {
      if (typeof discountValue !== 'number' || discountValue <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Discount value must be a positive number',
        });
      }

      const finalDiscountType = discountType || coupon.discountType;
      if (finalDiscountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({
          success: false,
          error: 'Percentage discount cannot exceed 100%',
        });
      }
    }

    // Validate applicable cylinder type if provided
    if (applicableCylinderType && !['Domestic', 'Commercial', 'Both'].includes(applicableCylinderType)) {
      return res.status(400).json({
        success: false,
        error: 'Applicable cylinder type must be "Domestic", "Commercial", or "Both"',
      });
    }

    // Update fields
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (applicableCylinderType !== undefined) coupon.applicableCylinderType = applicableCylinderType;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount || null;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate || null;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    const createdAt = coupon.createdAt || coupon.get('createdAt') || coupon.get('created_at') || new Date();
    const updatedAt = coupon.updatedAt || coupon.get('updatedAt') || coupon.get('updated_at') || new Date();

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        applicableCylinderType: coupon.applicableCylinderType,
        minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : null,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error updating coupon:', error);
    next(error);
  }
};

/**
 * Delete coupon
 * DELETE /api/admin/coupons/:code
 */
const deleteCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required',
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findByPk(normalizedCode);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    // If the database has a restrictive FK from coupon_usage -> coupons,
    // deleting the coupon will fail unless usage rows are removed first.
    await CouponUsage.destroy({ where: { couponCode: normalizedCode } });

    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting coupon:', error);
    next(error);
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
};

