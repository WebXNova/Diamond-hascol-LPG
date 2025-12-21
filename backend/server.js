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
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error("⚠️  Warning: Database connection failed, but server will continue");
    } else {
      // Sync database schema - DO NOT use force: true as it drops existing tables
      // Only create tables if they don't exist (safe for production)
      await sequelize.sync({ alter: false });
      console.log("✅ Database schema synced with models (tables created if they don't exist)");
      
      // Initialize products if they don't exist
      await initializeProducts();
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
