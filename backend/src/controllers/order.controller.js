const Order = require("../models/order.model");
const { calculateOrderTotal } = require("../utils/pricing");
const fs = require('fs');
const logPath = 'e:\\Desktop folder\\Desktop\\Work\\WebX Nova\\Diamond-hascol-LPG\\.cursor\\debug.log';

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
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:20',message:'createOrder called',data:{body:req.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
  } catch(e) {}
  // #endregion
  
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

    // Calculate order total (fetches price from database, applies coupon)
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:69',message:'Calling calculateOrderTotal',data:{cylinderType,quantity,couponCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e) {}
    // #endregion
    
    let pricing;
    try {
      pricing = await calculateOrderTotal(
        cylinderType, // 'Domestic' or 'Commercial'
        quantity,
        couponCode || null
      );
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:73',message:'calculateOrderTotal succeeded',data:{pricing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
    } catch (pricingError) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:76',message:'calculateOrderTotal failed',data:{error:pricingError.message,stack:pricingError.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
      throw pricingError;
    }

    // Create order (use camelCase property names - Sequelize maps to snake_case database columns)
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:76',message:'Creating order in database',data:{customerName:customerName.trim(),phone:phoneNumber.toString(),cylinderType:cylinderType,quantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n');
    } catch(e) {}
    // #endregion
    
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
    
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({
        location: 'order.controller.js:82',
        message: 'Attempting to create order in database',
        data: {
          customerName: orderData.customerName,
          phone: orderData.phone.toString(),
          cylinderType: orderData.cylinderType,
          quantity: orderData.quantity,
          pricePerCylinder: orderData.pricePerCylinder,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          totalPrice: orderData.totalPrice,
          couponCode: orderData.couponCode,
          status: orderData.status
        },
        timestamp: Date.now()
      }) + '\n');
    } catch(e) {}
    // #endregion
    
    let order;
    try {
      order = await Order.create(orderData);
      
      // Verify order was created
      if (!order || !order.id) {
        throw new Error('Order creation failed: No order ID returned');
      }
      
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          location: 'order.controller.js:95',
          message: 'Order created successfully in database',
          data: {
            orderId: order.id,
            customerName: order.customerName,
            phone: order.phone.toString(),
            cylinderType: order.cylinderType,
            quantity: order.quantity,
            pricePerCylinder: order.pricePerCylinder,
            subtotal: order.subtotal,
            discount: order.discount,
            totalPrice: order.totalPrice,
            couponCode: order.couponCode,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          },
          timestamp: Date.now()
        }) + '\n');
      } catch(e) {}
      // #endregion
      
      console.log(`✅ Order #${order.id} created successfully in database`);
      console.log(`   Customer: ${order.customerName}`);
      console.log(`   Type: ${order.cylinderType}, Qty: ${order.quantity}`);
      console.log(`   Total: ₨${order.totalPrice}`);
    } catch (dbError) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          location: 'order.controller.js:100',
          message: 'Database insert failed',
          data: {
            error: dbError.message,
            stack: dbError.stack,
            name: dbError.name,
            orderData: orderData
          },
          timestamp: Date.now()
        }) + '\n');
      } catch(e) {}
      // #endregion
      console.error('❌ Database error creating order:', dbError);
      throw dbError;
    }

    // Return success response with full order data
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:100',message:'Sending success response',data:{orderId:order.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    } catch(e) {}
    // #endregion
    
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
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:107',message:'Error caught in createOrder',data:{error:error.message,stack:error.stack,name:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n');
    } catch(e) {}
    // #endregion
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

