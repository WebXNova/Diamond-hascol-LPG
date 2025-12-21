const express = require("express");
const router = express.Router();
const { createMessage } = require("../../controllers/message.controller");
const { validateMessage } = require("../../middlewares/validation.middleware");
const { messageRateLimiter } = require("../../middlewares/rateLimit.middleware");

// POST /api/contact
router.post("/", messageRateLimiter, validateMessage, (req, res, next) => {
  createMessage(req, res, next);
});

module.exports = router;
