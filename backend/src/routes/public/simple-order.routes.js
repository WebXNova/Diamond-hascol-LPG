const express = require("express");
const router = express.Router();
const { createSimpleOrder } = require("../../controllers/simple-order.controller");

// POST /api/order - Simple order endpoint
router.post("/", createSimpleOrder);

module.exports = router;



