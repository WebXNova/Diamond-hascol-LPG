const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  updateProduct,
  uploadMiddleware,
} = require("../../controllers/admin/product.controller");

// GET /api/admin/products
router.get("/", (req, res, next) => {
  getAllProducts(req, res, next);
});

// GET /api/admin/products/:id
router.get("/:id", (req, res, next) => {
  getProductById(req, res, next);
});

// PATCH /api/admin/products/:id (with optional image upload)
router.patch("/:id", uploadMiddleware, (req, res, next) => {
  updateProduct(req, res, next);
});

module.exports = router;

