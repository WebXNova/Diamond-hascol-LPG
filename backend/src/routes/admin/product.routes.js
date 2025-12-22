const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  updateProduct,
  uploadMiddleware,
} = require("../../controllers/admin/product.controller");
const { auditAdminAction } = require("../../middlewares/audit.middleware");

// GET /api/admin/products
router.get("/", auditAdminAction("VIEW_PRODUCTS"), (req, res, next) => {
  getAllProducts(req, res, next);
});

// GET /api/admin/products/:id
router.get("/:id", auditAdminAction("VIEW_PRODUCT"), (req, res, next) => {
  getProductById(req, res, next);
});

// PATCH /api/admin/products/:id (sensitive action - logged)
router.patch("/:id", uploadMiddleware, auditAdminAction("UPDATE_PRODUCT"), (req, res, next) => {
  updateProduct(req, res, next);
});

module.exports = router;
