const Order = require("../models/order.model");
const { calculateOrderTotal, recordCouponUsage } = require("../utils/pricing");

/**
 * Create a new order
 * POST /api/orders
 * 
 * Frontend sends (camelCase):
 * {
 *   customerName: string,
 *   phone: string,
 *   address: string,
 *   cylinderType: 'Domestic' | 'Commercial',
 *   quantity: number,
 *   couponCode: string (optional)
 * }
 */
const createOrder = async (req, res, next) => {
  try {
    // Log incoming request for debugging
    console.log('📥 createOrder called with body:', req.body);
    
    // Extract fields (validation middleware handles validation)
    const { customerName, phone, address, cylinderType, quantity, couponCode } = req.body;
    
    console.log('📋 Extracted fields:', {
      customerName,
      phone,
      address,
      cylinderType,
      quantity,
      quantityType: typeof quantity,
      couponCode
    });

    // Sanitize phone (validation middleware already sanitized, but ensure it's digits only)
    const phoneDigits = phone.replace(/[^\d]/g, '');

    // Convert phone to BIGINT (validate it's a valid number)
    let phoneNumber;
    try {
      phoneNumber = BigInt(phoneDigits);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid phone number format' 
      });
    }

    // Calculate order total (fetches price from database, applies coupon with validation)
    // This function also checks stock availability - throws error if out of stock
    let pricing;
    try {
      pricing = await calculateOrderTotal(
        cylinderType, // 'Domestic' or 'Commercial'
        quantity,
        couponCode || null
      );
    } catch (pricingError) {
      // Re-throw with proper status code for stock errors
      if (pricingError.message && pricingError.message.includes('out of stock')) {
        return res.status(400).json({
          success: false,
          error: pricingError.message
        });
      }
      throw pricingError;
    }

    // Create order (use camelCase property names - Sequelize maps to snake_case database columns)
    // Prepare order data with all required fields
    const orderData = {
      customerName: customerName.trim(),
      phone: phoneNumber,
      address: address.trim(),
      cylinderType: cylinderType,
      quantity: quantity,
      pricePerCylinder: pricing.pricePerCylinder,
      subtotal: pricing.subtotal,
      discount: pricing.discount || 0,
      totalPrice: pricing.total,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
      status: 'pending',
    };
    
    let order;
    try {
      order = await Order.create(orderData);
      
      // Verify order was created
      if (!order || !order.id) {
        throw new Error('Order creation failed: No order ID returned');
      }
      
      console.log(`✅ Order #${order.id} created successfully in database`);
      console.log(`   Customer: ${order.customerName}`);
      console.log(`   Type: ${order.cylinderType}, Qty: ${order.quantity}`);
      console.log(`   Total: ₨${order.totalPrice}`);
    } catch (dbError) {
      console.error('❌ Database error creating order:', dbError);
      throw dbError;
    }

    // Record coupon usage if coupon was applied
    if (order.couponCode && pricing.discount > 0) {
      await recordCouponUsage(order.couponCode, order.id, pricing.discount);
    }

    // Return success response with full order data
    // Safely parse float values with fallbacks
    const pricePerCylinder = parseFloat(order.pricePerCylinder) || 0;
    const subtotal = parseFloat(order.subtotal) || 0;
    const discount = parseFloat(order.discount) || 0;
    const totalPrice = parseFloat(order.totalPrice) || 0;
    
    // Safely handle timestamps
    const createdAt = order.createdAt && order.createdAt.toISOString 
      ? order.createdAt.toISOString() 
      : new Date().toISOString();
    
    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        pricePerCylinder,
        subtotal,
        discount,
        totalPrice,
        couponCode: order.couponCode || null,
        status: order.status || 'pending',
        createdAt
      }
    });
  } catch (error) {
    // Pass error to error middleware
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Safely parse float values
    const pricePerCylinder = parseFloat(order.pricePerCylinder) || 0;
    const subtotal = parseFloat(order.subtotal) || 0;
    const discount = parseFloat(order.discount) || 0;
    const totalPrice = parseFloat(order.totalPrice) || 0;
    
    // Safely handle createdAt
    const createdAt = order.createdAt && order.createdAt.toISOString 
      ? order.createdAt.toISOString() 
      : new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        customerName: order.customerName,
        phone: order.phone.toString(),
        address: order.address,
        cylinderType: order.cylinderType,
        quantity: order.quantity,
        pricePerCylinder,
        subtotal,
        discount,
        totalPrice,
        couponCode: order.couponCode || null,
        status: order.status || 'pending',
        createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
};
