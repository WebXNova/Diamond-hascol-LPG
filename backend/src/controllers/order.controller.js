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
    // Extract and validate required fields (accept camelCase from frontend)
    const { customerName, phone, address, cylinderType, quantity, couponCode } = req.body;

    // Validate required fields
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:24',message:'Validation failed: customerName',data:{customerName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
      } catch(e) {}
      // #endregion
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:29',message:'Validation failed: phone',data:{phone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
      } catch(e) {}
      // #endregion
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:33',message:'Validation failed: address',data:{address},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
      } catch(e) {}
      // #endregion
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!cylinderType || !['Domestic', 'Commercial'].includes(cylinderType)) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:36',message:'Validation failed: cylinderType',data:{cylinderType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
      } catch(e) {}
      // #endregion
      return res.status(400).json({ error: 'Cylinder type must be Domestic or Commercial' });
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:40',message:'Validation failed: quantity',data:{quantity,type:typeof quantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
      } catch(e) {}
      // #endregion
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Sanitize phone (remove non-digits, but keep for validation)
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 7) {
      return res.status(400).json({ error: 'Phone number is too short' });
    }

    // Convert phone to BIGINT (validate it's a valid number)
    let phoneNumber;
    try {
      phoneNumber = BigInt(phoneDigits);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Reject unknown fields
    const allowedFields = ['customerName', 'phone', 'address', 'cylinderType', 'quantity', 'couponCode'];
    const receivedFields = Object.keys(req.body);
    const unknownFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (unknownFields.length > 0) {
      return res.status(400).json({ 
        error: `Unknown fields: ${unknownFields.join(', ')}` 
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

    // Create order (map camelCase to snake_case for database)
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:76',message:'Creating order in database',data:{customer_name:customerName.trim(),phone:phoneNumber.toString(),cylinder_type:cylinderType,quantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n');
    } catch(e) {}
    // #endregion
    
    let order;
    try {
      order = await Order.create({
        customer_name: customerName.trim(),
        phone: phoneNumber,
        address: address.trim(),
        cylinder_type: cylinderType,
        quantity: quantity,
        price_per_cylinder: pricing.pricePerCylinder,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        total_price: pricing.total,
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
        status: 'pending',
      });
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:91',message:'Order created successfully',data:{orderId:order.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n');
      } catch(e) {}
      // #endregion
    } catch (dbError) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:95',message:'Database insert failed',data:{error:dbError.message,stack:dbError.stack,name:dbError.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n');
      } catch(e) {}
      // #endregion
      throw dbError;
    }

    // Return success response
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'order.controller.js:100',message:'Sending success response',data:{orderId:order.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    } catch(e) {}
    // #endregion
    return res.status(201).json({
      success: true,
      orderId: order.id,
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
 * Get order by ID (for future use, not implemented in this phase)
 */
const getOrderById = async (req, res, next) => {
  return res.status(501).json({ error: 'Not implemented' });
};

module.exports = {
  createOrder,
  getOrderById,
};

