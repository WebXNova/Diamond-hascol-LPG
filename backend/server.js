require("dotenv").config();

// Validate environment variables first (fail fast)
const { validateEnv } = require("./src/utils/env-validator");
try {
  validateEnv();
} catch (error) {
  console.error("❌ Server startup aborted due to environment validation failure");
  process.exit(1);
}

const app = require("./src/app");
const { sequelize, testConnection } = require("./src/config/db");

// Load all models
const Order = require("./src/models/order.model");
const Coupon = require("./src/models/coupon.model");
const Product = require("./src/models/product.model");
const CouponUsage = require("./src/models/couponUsage.model");
const OrderStatusHistory = require("./src/models/orderStatusHistory.model");
const Message = require("./src/models/message.model");
const Admin = require("./src/models/admin.model");

// Define relationships after all models are loaded
Order.hasMany(OrderStatusHistory, {
  foreignKey: "orderId",
  as: "statusHistory",
});

Order.hasMany(CouponUsage, {
  foreignKey: "orderId",
  as: "couponUsages",
});

Order.belongsTo(Coupon, {
  foreignKey: "couponCode",
  targetKey: "code",
  as: "coupon",
});

CouponUsage.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

CouponUsage.belongsTo(Coupon, {
  foreignKey: "couponCode",
  targetKey: "code",
  as: "coupon",
});

Coupon.hasMany(CouponUsage, {
  foreignKey: "couponCode",
  sourceKey: "code",
  as: "usages",
});

const PORT = process.env.PORT || 5000;
let server = null; // Store server instance for graceful shutdown

/**
 * Ensure required schema pieces exist for coupons usage tracking.
 * This is idempotent and safe for local + production (no destructive changes).
 */
async function ensureCouponSchema() {
  const qi = sequelize.getQueryInterface();

  // Ensure coupons.usage_limit exists
  try {
    const couponsTable = await qi.describeTable("coupons");
    if (!couponsTable.usage_limit) {
      console.log("🛠️  Adding missing column coupons.usage_limit ...");
      await qi.addColumn("coupons", "usage_limit", {
        type: require("sequelize").DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      });
      console.log("✅ Added coupons.usage_limit");
    }
  } catch (e) {
    console.warn("⚠️  Could not verify/add coupons.usage_limit:", e.message);
  }

  // Ensure coupon_usage.coupon_code is NOT unique (multi-use coupons)
  try {
    const indexes = await qi.showIndex("coupon_usage");
    const uniqueCouponCodeIndex = indexes.find((idx) => {
      const fields = (idx.fields || []).map((f) => f.attribute || f.name);
      return idx.unique === true && fields.length === 1 && fields[0] === "coupon_code";
    });

    if (uniqueCouponCodeIndex) {
      console.log(`🛠️  Dropping unique index on coupon_usage.coupon_code (${uniqueCouponCodeIndex.name}) ...`);
      await qi.removeIndex("coupon_usage", uniqueCouponCodeIndex.name);
      console.log("✅ Dropped unique index on coupon_usage.coupon_code");
    }
  } catch (e) {
    console.warn("⚠️  Could not verify/drop unique index on coupon_usage.coupon_code:", e.message);
  }
}

/**
 * Initialize products in database if they don't exist
 */
async function initializeProducts() {
  try {
    // Check if products exist (using correct field: category)
    const domesticProduct = await Product.findOne({ where: { category: 'Domestic' } }).catch(() => null);
    const commercialProduct = await Product.findOne({ where: { category: 'Commercial' } }).catch(() => null);
    
    // Create Domestic product if it doesn't exist
    if (!domesticProduct) {
      await Product.create({
        name: 'Domestic LPG Cylinder',
        category: 'Domestic',
        price: 2500.00,
        inStock: true,
      });
      console.log("✅ Created Domestic product in database");
    }
    
    // Create Commercial product if it doesn't exist
    if (!commercialProduct) {
      await Product.create({
        name: 'Commercial LPG Cylinder',
        category: 'Commercial',
        price: 3000.00,
        inStock: true,
      });
      console.log("✅ Created Commercial product in database");
    }
  } catch (error) {
    console.error("⚠️  Warning: Failed to initialize products:", error.message);
    console.log("💡 Orders will use default prices (Domestic: ₨2500, Commercial: ₨3000)");
  }
}
   
// Start server
const startServer = async () => {
  try {
    // Test database connection - exit if it fails
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error("❌ Fatal: Database connection failed. Server cannot start without database.");
      console.error("💡 Please check your database configuration in .env file");
      process.exit(1);
    }

    // Sync database schema - DO NOT use force: true as it drops existing tables
    // Only create tables if they don't exist (safe for production)
    await sequelize.sync({ alter: false });
    console.log("✅ Database schema synced with models (tables created if they don't exist)");

    // Ensure coupon usage tracking schema is present (idempotent)
    await ensureCouponSchema();
    
    // Initialize products if they don't exist
    await initializeProducts();

    // Bootstrap admin user (one-time, only if no admin exists)
    const { bootstrapAdmin } = require("./src/utils/bootstrap");
    await bootstrapAdmin();

    // Start Express server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`✅ Server and database are ready`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 * Closes HTTP server and database connections properly
 */
async function gracefulShutdown(signal) {
  console.log(`\n${signal} signal received: starting graceful shutdown...`);
  
  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }
  
  // Close database connections
  try {
    await sequelize.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  
  process.exit(0);
}

// Handle graceful shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit in production, log and continue
  if (process.env.NODE_ENV === 'production') {
    // In production, log but don't crash
  } else {
    // In development, exit to catch issues early
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Start the server
startServer();
