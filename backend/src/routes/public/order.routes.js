const express = require("express");
const router = express.Router();
const { createOrder } = require("../../controllers/order.controller");
const { validateOrder } = require("../../middlewares/validation.middleware");
const { orderRateLimiter } = require("../../middlewares/rateLimit.middleware");

const { getOrderById } = require("../../controllers/order.controller");

// POST /api/orders
router.post("/", orderRateLimiter, validateOrder, (req, res, next) => {
  createOrder(req, res, next);
});

// GET /api/orders/:id
router.get("/:id", (req, res, next) => {
  getOrderById(req, res, next);
});

module.exports = router;
