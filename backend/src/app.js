const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const orderRoutes = require("./routes/public/order.routes");
const couponRoutes = require("./routes/public/coupon.routes");
const productRoutes = require("./routes/public/product.routes");
const messageRoutes = require("./routes/public/message.routes");
const adminOrderRoutes = require("./routes/admin/order.routes");
const adminCouponRoutes = require("./routes/admin/coupon.routes");
const adminMessageRoutes = require("./routes/admin/message.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Enable JSON body parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Enable CORS
app.use(cors());

// Basic security middleware
app.use(helmet());

// Public routes
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact", messageRoutes);

// Admin routes (no auth middleware - open for now)
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/messages", adminMessageRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
