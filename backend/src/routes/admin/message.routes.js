const express = require("express");
const router = express.Router();
const { getMessages, markAsRead, deleteMessage } = require("../../controllers/admin/message.controller");
const { auditAdminAction } = require("../../middlewares/audit.middleware");

// GET /api/admin/messages
router.get("/", auditAdminAction("VIEW_MESSAGES"), (req, res, next) => {
  getMessages(req, res, next);
});

// PATCH /api/admin/messages/:id/read
router.patch("/:id/read", auditAdminAction("MARK_MESSAGE_READ"), (req, res, next) => {
  markAsRead(req, res, next);
});

// DELETE /api/admin/messages/:id (sensitive action - logged)
router.delete("/:id", auditAdminAction("DELETE_MESSAGE"), (req, res, next) => {
  deleteMessage(req, res, next);
});

module.exports = router;
