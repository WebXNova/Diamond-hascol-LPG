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
    // First, check if products table exists by trying to query it
    try {
      await Product.findOne({ limit: 1 });
    } catch (tableError) {
      // Products table doesn't exist - create it (matching real schema)
      console.log("📦 Products table doesn't exist, creating it...");
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          category ENUM('Domestic', 'Commercial') NOT NULL,
          description TEXT NULL,
          price DECIMAL(10,2) NOT NULL,
          image_url VARCHAR(500) NULL,
          in_stock BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Products table created");
    }
    
    // Check if products exist (using correct field: category)
    const domesticProduct = await Product.findOne({ where: { category: 'Domestic' } }).catch(() => null);
    const commercialProduct = await Product.findOne({ where: { category: 'Commercial' } }).catch(() => null);
    
    // Create Domestic product if it doesn't exist (using correct fields: category, inStock)
    if (!domesticProduct) {
      await Product.create({
        name: 'Domestic LPG Cylinder',
        category: 'Domestic',
        price: 2500.00,
        inStock: true,
      });
      console.log("✅ Created Domestic product in database");
    }
    
    // Create Commercial product if it doesn't exist (using correct fields: category, inStock)
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
      // Only create tables if they don't exist
      await sequelize.sync({ alter: false }); // Set alter: true to update schema without dropping data
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
