const Order = require("../../models/order.model");

/**
 * Get all orders (with optional filtering)
 * GET /api/admin/orders
 * Note: By default, excludes delivered and cancelled orders (they should be in history)
 */
const getOrders = async (req, res, next) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    // Build where clause
    // Always exclude delivered and cancelled orders from the orders section
    // They should only appear in the history section
    const { Op } = require('sequelize');
    const where = {
      status: {
        [Op.notIn]: ['delivered', 'cancelled']
      }
    };
    
    // If a specific status is requested (and it's not delivered/cancelled), filter by it
    if (status && status !== 'all' && status !== 'delivered' && status !== 'cancelled') {
      where.status = status;
    }

    // Fetch orders from database
    // Use Sequelize.literal for ordering to ensure it works with underscored fields
    const { Sequelize } = require('sequelize');
    const orders = await Order.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[Sequelize.literal('created_at'), 'DESC']],
    });

    console.log(`📦 Fetched ${orders.length} orders from database`);

    // Format orders for frontend
    // Sequelize returns camelCase properties even with underscored: true
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
    console.error('❌ Error fetching orders:', error);
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/admin/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Safely get createdAt - Sequelize returns it as createdAt (camelCase)
    const createdAt = order.createdAt || order.get('createdAt') || order.get('created_at') || new Date();

    // Format order for frontend
    const formattedOrder = {
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

    return res.status(200).json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error('❌ Error fetching order by ID:', error);
    next(error);
  }
};

/**
 * Update order status
 * PATCH /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status - must match Order model ENUM values (including in-transit)
    const validStatuses = ['pending', 'confirmed', 'in-transit', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Update status
    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        id: order.id,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an order
 * DELETE /api/admin/orders/:id
 */
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    await order.destroy();

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
