const express = require("express");
const router = express.Router();
const { createCoupon, getCoupons, getCouponByCode, updateCoupon, deleteCoupon } = require("../../controllers/admin/coupon.controller");
const { auditAdminAction } = require("../../middlewares/audit.middleware");

// POST /api/admin/coupons (sensitive action - logged)
router.post("/", auditAdminAction("CREATE_COUPON"), (req, res, next) => {
  createCoupon(req, res, next);
});

// GET /api/admin/coupons
router.get("/", auditAdminAction("VIEW_COUPONS"), (req, res, next) => {
  getCoupons(req, res, next);
});

// GET /api/admin/coupons/:code
router.get("/:code", auditAdminAction("VIEW_COUPON"), (req, res, next) => {
  getCouponByCode(req, res, next);
});

// PATCH /api/admin/coupons/:code (sensitive action - logged)
router.patch("/:code", auditAdminAction("UPDATE_COUPON"), (req, res, next) => {
  updateCoupon(req, res, next);
});

// DELETE /api/admin/coupons/:code (sensitive action - logged)
router.delete("/:code", auditAdminAction("DELETE_COUPON"), (req, res, next) => {
  deleteCoupon(req, res, next);
});

module.exports = router;
