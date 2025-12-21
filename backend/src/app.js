const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const orderRoutes = require("./routes/public/order.routes");
const simpleOrderRoutes = require("./routes/public/simple-order.routes");
const couponRoutes = require("./routes/public/coupon.routes");
const productRoutes = require("./routes/public/product.routes");
const messageRoutes = require("./routes/public/message.routes");
const adminOrderRoutes = require("./routes/admin/order.routes");
const adminCouponRoutes = require("./routes/admin/coupon.routes");
const adminMessageRoutes = require("./routes/admin/message.routes");
const adminProductRoutes = require("./routes/admin/product.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  if (req.method === 'POST' && (req.path.includes('/orders') || req.path.includes('/order') || req.path.includes('/contact') || req.path.includes('/coupons'))) {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log('   Headers:', {
      'content-type': req.headers['content-type'],
      'origin': req.headers['origin'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
  }
  next();
});

// Enable JSON body parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Enable URL-encoded body parsing
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enable CORS - allow all origins for now
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic security middleware
app.use(helmet());

// Public routes
app.use("/api/order", simpleOrderRoutes); // Simple order endpoint (must be before /api/orders)
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact", messageRoutes);

// Admin routes (no auth middleware - open for now)
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/messages", adminMessageRoutes);
app.use("/api/admin/products", adminProductRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
