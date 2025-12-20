const express = require("express");
const router = express.Router();
const { validateCouponCode } = require("../../controllers/coupon.controller");

// POST /api/coupons/validate
router.post("/validate", (req, res, next) => {
  validateCouponCode(req, res, next);
});

module.exports = router;


