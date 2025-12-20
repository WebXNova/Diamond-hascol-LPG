const express = require("express");
const router = express.Router();
const { createMessage } = require("../../controllers/message.controller");

// POST /api/contact
router.post("/", (req, res, next) => {
  createMessage(req, res, next);
});

module.exports = router;
