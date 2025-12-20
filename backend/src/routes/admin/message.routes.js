const express = require("express");
const router = express.Router();
const { getMessages, markAsRead, deleteMessage } = require("../../controllers/admin/message.controller");

// GET /api/admin/messages
router.get("/", (req, res, next) => {
  getMessages(req, res, next);
});

// PATCH /api/admin/messages/:id/read
router.patch("/:id/read", (req, res, next) => {
  markAsRead(req, res, next);
});

// DELETE /api/admin/messages/:id
router.delete("/:id", (req, res, next) => {
  deleteMessage(req, res, next);
});

module.exports = router;
