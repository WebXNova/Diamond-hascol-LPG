const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Compression is optional - use if available, otherwise skip
let compression;
try {
  compression = require("compression");
} catch (e) {
  // Compression not installed - optional feature
  compression = null;
}
const orderRoutes = require("./routes/public/order.routes");
const simpleOrderRoutes = require("./routes/public/simple-order.routes");
const couponRoutes = require("./routes/public/coupon.routes");
const productRoutes = require("./routes/public/product.routes");
const messageRoutes = require("./routes/public/message.routes");
const adminOrderRoutes = require("./routes/admin/order.routes");
const adminCouponRoutes = require("./routes/admin/coupon.routes");
const adminMessageRoutes = require("./routes/admin/message.routes");
const adminProductRoutes = require("./routes/admin/product.routes");
const adminAuthRoutes = require("./routes/admin/auth.routes");
const { authenticateAdmin } = require("./middlewares/auth.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Request logging middleware (uses safe logger)
const logger = require('./utils/logger');
app.use((req, res, next) => {
  logger.request(req);
  next();
});

// Enable JSON body parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Enable URL-encoded body parsing
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS configuration - separate for public and admin routes
const publicCorsOptions = {
  origin: '*', // Public APIs can be accessed from anywhere
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Admin CORS - restrict to frontend origin in production
const adminCorsOptions = {
  origin: process.env.FRONTEND_URL || process.env.ADMIN_CORS_ORIGIN || '*', // Restrict in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials (cookies, auth headers)
};

// Apply public CORS to all routes
app.use(cors(publicCorsOptions));

// Compression middleware (reduce response size) - optional
if (compression) {
  app.use(compression());
} else {
  // Compression not available - continue without it (non-critical)
}

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-inline needed for inline scripts
    },
  },
}));

// Public routes
app.use("/api/order", simpleOrderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact", messageRoutes);

// Admin auth routes (public, but rate-limited)
app.use("/api/admin/auth", cors(adminCorsOptions), adminAuthRoutes);

// Admin routes (PROTECTED - require authentication)
app.use("/api/admin/orders", cors(adminCorsOptions), authenticateAdmin, adminOrderRoutes);
app.use("/api/admin/coupons", cors(adminCorsOptions), authenticateAdmin, adminCouponRoutes);
app.use("/api/admin/messages", cors(adminCorsOptions), authenticateAdmin, adminMessageRoutes);
app.use("/api/admin/products", cors(adminCorsOptions), authenticateAdmin, adminProductRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global 404 handler for unknown routes (must be before error middleware)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
