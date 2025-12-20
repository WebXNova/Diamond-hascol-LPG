const express = require("express");
const router = express.Router();
const { getAllProducts, getProductById } = require("../../controllers/product.controller");

// GET /api/products
router.get("/", (req, res, next) => {
  getAllProducts(req, res, next);
});

// GET /api/products/:id
router.get("/:id", (req, res, next) => {
  getProductById(req, res, next);
});

module.exports = router;


