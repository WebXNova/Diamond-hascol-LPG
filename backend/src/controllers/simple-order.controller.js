const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Coupon = require("../models/coupon.model");
const { recordCouponUsage } = require("../utils/pricing");
const logger = require("../utils/logger");

/**
 * Simple order creation endpoint
 * POST /api/order
 * 
 * Expected body:
 * {
 *   name: string (required),
 *   phone: string (required),
 *   address: string (required),
 *   cylinderType: 'Domestic' | 'Commercial' (required),
 *   quantity: number (required, min: 1),
 *   couponCode?: string (optional)
 * }
 */
const createSimpleOrder = async (req, res) => {
  console.log('📥 POST /api/order - Request received');
  console.log('   Body:', JSON.stringify(req.body, null, 2));

  try {
    // Extract and validate required fields
    const { name, phone, address, cylinderType, quantity, couponCode } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      console.log('❌ Validation failed: name');
      return res.status(400).json({ 
        success: false, 
        error: 'Name is required and must be at least 2 characters' 
      });
    }

    if (!phone || typeof phone !== 'string') {
      // Use logger instead of console.log (redacts sensitive data)
      const logger = require('../utils/logger');
      logger.warn('Validation failed: phone');
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }

    // Sanitize phone - remove all non-digits
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 7) {
      logger.warn('Validation failed: phone too short');
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number must contain at least 7 digits' 
      });
    }

    if (!address || typeof address !== 'string' || address.trim().length < 10) {
      logger.warn('Validation failed: address');
      return res.status(400).json({ 
        success: false, 
        error: 'Address is required and must be at least 10 characters' 
      });
    }

    if (!cylinderType || !['Domestic', 'Commercial'].includes(cylinderType)) {
      console.log('❌ Validation failed: cylinderType');
      return res.status(400).json({ 
        success: false, 
        error: 'Cylinder type must be "Domestic" or "Commercial"' 
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 999) {
      console.log('❌ Validation failed: quantity');
      return res.status(400).json({ 
        success: false, 
        error: 'Quantity must be a number between 1 and 999' 
      });
    }

    console.log('✅ Validation passed');

    // Get product price from database
    console.log('📦 Fetching product price for:', cylinderType);
    const product = await Product.findOne({ 
      where: { category: cylinderType } 
    });

    // Check stock availability
    if (product && product.inStock === false) {
      console.log('❌ Product out of stock');
      return res.status(400).json({ 
        success: false, 
        error: 'This product is currently out of stock. Please check back later.' 
      });
    }

    let pricePerCylinder = 2500; // Default for Domestic
    if (cylinderType === 'Commercial') {
      pricePerCylinder = 3000; // Default for Commercial
    }

    if (product && product.price) {
      pricePerCylinder = parseFloat(product.price);
      console.log('   Found product price:', pricePerCylinder);
    } else {
      console.log('   Using default price:', pricePerCylinder);
    }

    // Calculate subtotal
    const subtotal = pricePerCylinder * qty;

    // Validate and apply coupon if provided - use same validation as /api/coupons/validate
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode && couponCode.trim()) {
      const normalizedCouponCode = couponCode.trim().toUpperCase();
      console.log('🎫 Validating coupon:', normalizedCouponCode);

      try {
        const coupon = await Coupon.findOne({
          where: {
            code: normalizedCouponCode,
            isActive: true
          }
        });

        if (coupon) {
          // Check expiry date
          let isValid = true;
          if (coupon.expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(coupon.expiryDate);
            if (expiry < today) {
              isValid = false;
              console.log('   Coupon expired');
            }
          }

          // Check minimum order amount
          if (isValid && coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
            isValid = false;
            console.log('   Minimum order amount not met');
          }

          // Check applicable cylinder type
          if (isValid && coupon.applicableCylinderType !== 'Both' && coupon.applicableCylinderType !== cylinderType) {
            isValid = false;
            console.log('   Coupon not applicable for this cylinder type');
          }

          // Enforce usage limit
          if (isValid) {
            const CouponUsage = require("../models/couponUsage.model");
            const usedCount = await CouponUsage.count({
              where: { couponCode: normalizedCouponCode },
            });
            const limit = coupon.usageLimit ? parseInt(coupon.usageLimit, 10) : 100;
            if (usedCount >= limit) {
              isValid = false;
              console.log('   Coupon usage limit reached');
            }
          }

          if (isValid) {
            const discountValue = parseFloat(coupon.discountValue);
            if (coupon.discountType === 'percentage') {
              discount = Math.round((subtotal * discountValue) / 100);
            } else {
              // Flat discount
              discount = Math.min(subtotal, discountValue);
            }
            appliedCouponCode = coupon.code;
            console.log('   ✅ Coupon applied, discount:', discount);
          } else {
            console.log('   ❌ Coupon validation failed');
          }
        } else {
          console.log('   ❌ Coupon not found');
        }
      } catch (couponError) {
        console.error('   ❌ Error validating coupon:', couponError);
        // Continue without coupon if validation fails
      }
    }

    // Calculate total
    const totalPrice = subtotal - discount;

    console.log('💰 Calculated totals:', {
      pricePerCylinder,
      quantity: qty,
      subtotal,
      discount,
      totalPrice,
      couponCode: appliedCouponCode
    });

    // Convert phone to BigInt for database
    let phoneNumber;
    try {
      phoneNumber = BigInt(phoneDigits);
    } catch (error) {
      logger.warn('Invalid phone number format');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format' 
      });
    }

    // Prepare order data
    const orderData = {
      customerName: name.trim(),
      phone: phoneNumber,
      address: address.trim(),
      cylinderType: cylinderType,
      quantity: qty,
      pricePerCylinder: pricePerCylinder,
      subtotal: subtotal,
      discount: discount,
      totalPrice: totalPrice,
      couponCode: appliedCouponCode,
      status: 'pending',  // New orders start as pending
    };

    console.log('💾 Saving order to database...');
    
    // Save to database
    const order = await Order.create(orderData);

    console.log('✅ Order saved successfully!');
    console.log('   Order ID:', order.id);
    console.log('   Customer:', order.customerName);
    console.log('   Total:', order.totalPrice);

    // Record coupon usage if coupon was applied
    if (order.couponCode && discount > 0) {
      await recordCouponUsage(order.couponCode, order.id, discount);
    }

    // Return success with enhanced response
    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
        pricePerCylinder: parseFloat(order.pricePerCylinder),
        subtotal: parseFloat(order.subtotal),
        discount: parseFloat(order.discount),
        totalPrice: parseFloat(order.totalPrice),
        couponCode: order.couponCode || null,
        message: 'Order created successfully'
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('   Error name:', error.name);
    
    // Provide more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment 
      ? `Failed to create order: ${error.message}`
      : 'Failed to create order. Please try again.';
    
    // Check for specific error types
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors?.map(e => e.message).join(', ') || error.message;
      return res.status(400).json({
        success: false,
        error: isDevelopment ? `Validation error: ${validationErrors}` : 'Invalid order data provided.'
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        success: false,
        error: isDevelopment ? `Database error: ${error.message}` : 'Database error occurred. Please contact support.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

module.exports = { createSimpleOrder };
