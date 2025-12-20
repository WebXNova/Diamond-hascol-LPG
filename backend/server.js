require("dotenv").config();
const app = require("./src/app");
const { sequelize, testConnection } = require("./src/config/db");

// Load all models
const Order = require("./src/models/order.model");
const Coupon = require("./src/models/coupon.model");
const Product = require("./src/models/product.model");
const CouponUsage = require("./src/models/couponUsage.model");
const OrderStatusHistory = require("./src/models/orderStatusHistory.model");
const Message = require("./src/models/message.model");

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
   
// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error("⚠️  Warning: Database connection failed, but server will continue");
    } else {
      // Sync database schema - only use force: true in development
      if (process.env.NODE_ENV === "development") {
        await sequelize.sync({ force: true });
        console.log("✅ Database schema synced with models (force: true - development mode)");
      } else {
        await sequelize.sync(); // Only creates tables if they don't exist
        console.log("✅ Database schema synced with models");
      }
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      if (dbConnected) {
        console.log(`✅ Server and database are ready`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing server");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing server");
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();
