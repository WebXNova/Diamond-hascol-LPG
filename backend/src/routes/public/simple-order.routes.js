const express = require("express");
const router = express.Router();
const { createSimpleOrder } = require("../../controllers/simple-order.controller");
const { validateSimpleOrder } = require("../../middlewares/validation.middleware");
const { orderRateLimiter } = require("../../middlewares/rateLimit.middleware");

// POST /api/order - Simple order endpoint
router.post("/", orderRateLimiter, validateSimpleOrder, (req, res, next) => {
  createSimpleOrder(req, res, next);
});

module.exports = router;



