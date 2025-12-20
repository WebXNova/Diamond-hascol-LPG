const express = require("express");
const router = express.Router();
const { createCoupon, getCoupons, getCouponByCode, updateCoupon, deleteCoupon } = require("../../controllers/admin/coupon.controller");

// POST /api/admin/coupons
router.post("/", (req, res, next) => {
  createCoupon(req, res, next);
});

// GET /api/admin/coupons
router.get("/", (req, res, next) => {
  getCoupons(req, res, next);
});

// GET /api/admin/coupons/:code
router.get("/:code", (req, res, next) => {
  getCouponByCode(req, res, next);
});

// PATCH /api/admin/coupons/:code
router.patch("/:code", (req, res, next) => {
  updateCoupon(req, res, next);
});

// DELETE /api/admin/coupons/:code
router.delete("/:code", (req, res, next) => {
  deleteCoupon(req, res, next);
});

module.exports = router;
