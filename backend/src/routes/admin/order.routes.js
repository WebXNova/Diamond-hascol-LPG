const express = require("express");
const router = express.Router();
const { getOrders, getOrderById, updateOrderStatus, deleteOrder } = require("../../controllers/admin/order.controller");
const { getOrderHistory } = require("../../controllers/orderHistory.controller");
const { auditAdminAction } = require("../../middlewares/audit.middleware");

// GET /api/admin/orders/history (must be before /:id route)
router.get("/history", auditAdminAction("VIEW_ORDER_HISTORY"), (req, res, next) => {
  getOrderHistory(req, res, next);
});

// GET /api/admin/orders
router.get("/", auditAdminAction("VIEW_ORDERS"), (req, res, next) => {
  getOrders(req, res, next);
});

// GET /api/admin/orders/:id
router.get("/:id", auditAdminAction("VIEW_ORDER"), (req, res, next) => {
  getOrderById(req, res, next);
});

// PATCH /api/admin/orders/:id/status (sensitive action - logged)
router.patch("/:id/status", auditAdminAction("UPDATE_ORDER_STATUS"), (req, res, next) => {
  updateOrderStatus(req, res, next);
});

// DELETE /api/admin/orders/:id (sensitive action - logged)
router.delete("/:id", auditAdminAction("DELETE_ORDER"), (req, res, next) => {
  deleteOrder(req, res, next);
});

module.exports = router;
