const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

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

// Admin CORS - allow only trusted frontend origins (avoid wildcard + credentials issues)
const allowedAdminOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.ADMIN_CORS_ORIGIN,
    'http://localhost:5173', // Vite dev server
  ].filter(Boolean)
);

const adminCorsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no Origin header (same-origin, server-to-server, Postman)
    if (!origin) return cb(null, true);
    if (allowedAdminOrigins.has(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false // JWT is sent via Authorization header, not cookies
};

// Apply public CORS to all routes
app.use(cors(publicCorsOptions));

// Ensure admin preflight requests succeed
app.options(/^\/api\/admin\/.*$/, cors(adminCorsOptions));

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

// -------- Static assets + admin HTML (served by backend) --------
const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend");
const ADMIN_DIR = path.join(FRONTEND_DIR, "admin");
const NOT_FOUND_HTML = path.join(FRONTEND_DIR, "404.html");

// Serve required asset folders (keep these working without ?key=...)
app.use("/css", express.static(path.join(FRONTEND_DIR, "css")));
app.use("/js", express.static(path.join(FRONTEND_DIR, "js")));
app.use("/public", express.static(path.join(FRONTEND_DIR, "public")));
app.use("/data", express.static(path.join(FRONTEND_DIR, "data")));

// Home page (used for redirects)
app.get("/", (req, res) => {
  return res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// /admin -> /admin/login (redirect without middleware - frontend will validate)
app.get(["/admin", "/admin/"], (req, res) => {
  const key = req.query.key || req.query.access || '';
  const redirectUrl = key ? `/admin/login?key=${encodeURIComponent(key)}` : '/admin/login';
  return res.redirect(302, redirectUrl);
});

// Pretty admin routes -> serve legacy HTML files from frontend/admin/
// Frontend validation handles access key checking (no backend middleware)
const adminPages = {
  login: "login.html",
  dashboard: "dashboard.html",
  orders: "orders.html",
  messages: "messages.html",
  coupons: "coupons.html",
  products: "products.html",
  history: "history.html",
  settings: "settings.html",
};

for (const [route, file] of Object.entries(adminPages)) {
  app.get([`/admin/${route}`, `/admin/${route}/`], (req, res) => {
    return res.sendFile(path.join(ADMIN_DIR, file));
  });
}

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
  // API endpoints keep JSON responses
  if ((req.originalUrl || "").startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      error: "Route not found",
    });
  }

  // Browser routes show a friendly HTML page
  return res.status(404).sendFile(NOT_FOUND_HTML);
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
