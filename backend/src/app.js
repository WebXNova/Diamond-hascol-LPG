const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Test Route
app.get("/", (req, res) => {
  res.send("Diamond Hascol LPG Backend Running 🚀");
});

// ============================================
// PUBLIC ROUTES
// ============================================

// Orders Routes
app.post("/api/orders", (req, res) => {
  res.json({ success: true, message: "Order endpoint - to be implemented" });
});

// Coupons Routes
app.post("/api/coupons/validate", (req, res) => {
  res.json({ success: true, message: "Validate coupon endpoint - to be implemented" });
});

// Messages Routes
app.post("/api/messages", (req, res) => {
  res.json({ success: true, message: "Message endpoint - to be implemented" });
});

// ============================================
// ADMIN ROUTES
// ============================================

// Auth Routes
app.post("/api/admin/auth/login", (req, res) => {
  res.json({ success: true, message: "Admin login endpoint - to be implemented" });
});

// Dashboard Routes
app.get("/api/admin/dashboard", (req, res) => {
  res.json({ success: true, message: "Dashboard endpoint - to be implemented" });
});

// Admin Orders Routes
app.get("/api/admin/orders", (req, res) => {
  res.json({ success: true, message: "Get orders endpoint - to be implemented" });
});

app.patch("/api/admin/orders/:id/status", (req, res) => {
  res.json({ success: true, message: "Update order status endpoint - to be implemented" });
});

app.get("/api/admin/orders/export", (req, res) => {
  res.json({ success: true, message: "Export orders endpoint - to be implemented" });
});

// Admin Coupons Routes
app.get("/api/admin/coupons", (req, res) => {
  res.json({ success: true, message: "Get coupons endpoint - to be implemented" });
});

app.post("/api/admin/coupons", (req, res) => {
  res.json({ success: true, message: "Create coupon endpoint - to be implemented" });
});

app.patch("/api/admin/coupons/:id", (req, res) => {
  res.json({ success: true, message: "Update coupon endpoint - to be implemented" });
});

app.delete("/api/admin/coupons/:id", (req, res) => {
  res.json({ success: true, message: "Delete coupon endpoint - to be implemented" });
});

// Admin Messages Routes
app.get("/api/admin/messages", (req, res) => {
  res.json({ success: true, message: "Get messages endpoint - to be implemented" });
});

app.post("/api/admin/messages/:id/reply", (req, res) => {
  res.json({ success: true, message: "Reply to message endpoint - to be implemented" });
});

// Error handling middleware (catch all undefined routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

module.exports = app;
