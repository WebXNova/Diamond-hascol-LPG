const Order = require("../models/order.model");

/**
 * Get order history (only delivered and cancelled orders)
 * GET /api/admin/orders/history
 */
const getOrderHistory = async (req, res, next) => {
  try {
    const { status, limit = 1000, offset = 0 } = req.query;

    // Build where clause - only delivered and cancelled orders
    const { Sequelize } = require('sequelize');
    const { Op } = require('sequelize');
    
    const where = {
      status: {
        [Op.in]: ['delivered', 'cancelled']
      }
    };

    // If a specific status is requested and it's delivered or cancelled, filter by it
    if (status && status !== 'all' && ['delivered', 'cancelled'].includes(status)) {
      where.status = status;
    }

    // Fetch orders from database
    const orders = await Order.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[Sequelize.literal('created_at'), 'DESC']],
    });

    console.log(`📦 Fetched ${orders.length} orders from history`);

    // Format orders for frontend
    const formattedOrders = orders.map(order => {
      // Safely get createdAt - Sequelize returns it as createdAt (camelCase)
      const createdAt = order.createdAt || order.get('createdAt') || order.get('created_at') || new Date();
      
      return {
        id: order.id,
        customerName: order.customerName || '',
        phone: order.phone ? order.phone.toString() : '',
        address: order.address || '',
        cylinderType: order.cylinderType || '',
        quantity: order.quantity || 0,
        pricePerCylinder: parseFloat(order.pricePerCylinder) || 0,
        subtotal: parseFloat(order.subtotal) || 0,
        discount: parseFloat(order.discount) || 0,
        total: parseFloat(order.totalPrice) || 0,
        couponCode: order.couponCode || null,
        status: order.status || 'pending',
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
    console.error('❌ Error fetching order history:', error);
    next(error);
  }
};

module.exports = {
  getOrderHistory,
};
