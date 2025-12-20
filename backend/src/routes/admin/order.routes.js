const express = require("express");
const router = express.Router();
const { getOrders, getOrderById, updateOrderStatus, deleteOrder } = require("../../controllers/admin/order.controller");

// GET /api/admin/orders
router.get("/", (req, res, next) => {
  getOrders(req, res, next);
});

// GET /api/admin/orders/:id
router.get("/:id", (req, res, next) => {
  getOrderById(req, res, next);
});

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", (req, res, next) => {
  updateOrderStatus(req, res, next);
});

// DELETE /api/admin/orders/:id
router.delete("/:id", (req, res, next) => {
  deleteOrder(req, res, next);
});

module.exports = router;
