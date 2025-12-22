const express = require("express");
const router = express.Router();
const { login, verify, logout } = require("../../controllers/auth.controller");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");
const { adminAuthRateLimiter } = require("../../middlewares/rateLimit.middleware");

// POST /api/admin/auth/login (rate limited to prevent brute-force)
router.post("/login", adminAuthRateLimiter, (req, res, next) => {
  login(req, res, next);
});

// GET /api/admin/auth/verify (protected route)
router.get("/verify", authenticateAdmin, (req, res, next) => {
  verify(req, res, next);
});

// POST /api/admin/auth/logout (protected route)
router.post("/logout", authenticateAdmin, (req, res, next) => {
  logout(req, res, next);
});

module.exports = router;
