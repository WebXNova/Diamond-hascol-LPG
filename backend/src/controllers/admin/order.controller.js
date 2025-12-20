const Order = require("../../models/order.model");

/**
 * Get all orders (with optional filtering)
 * GET /api/admin/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch orders from database
    const orders = await Order.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      customerName: order.customerName,
      phone: order.phone.toString(),
      address: order.address,
      cylinderType: order.cylinderType,
      quantity: order.quantity,
      pricePerCylinder: parseFloat(order.pricePerCylinder),
      subtotal: parseFloat(order.subtotal),
      discount: parseFloat(order.discount),
      total: parseFloat(order.totalPrice),
      couponCode: order.couponCode,
      status: order.status,
      createdAt: order.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
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
        error: 'Order not found',
      });
    }

    // Format order for frontend
    const formattedOrder = {
      id: order.id,
      customerName: order.customerName,
      phone: order.phone.toString(),
      address: order.address,
      cylinderType: order.cylinderType,
      quantity: order.quantity,
      pricePerCylinder: parseFloat(order.pricePerCylinder),
      subtotal: parseFloat(order.subtotal),
      discount: parseFloat(order.discount),
      total: parseFloat(order.totalPrice),
      couponCode: order.couponCode,
      status: order.status,
      createdAt: order.created_at,
    };

    return res.status(200).json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
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

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in-transit', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
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

