/**
 * DEPRECATED: This mysql2 pool configuration is not used.
 * All models and database operations use Sequelize from src/config/db.js
 * 
 * This file is kept for backward compatibility but should not be imported.
 * If you need database access, use: require("../src/config/db")
 */

const mysql = require("mysql2/promise");

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "diamond_hascol_lpg",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected Successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
    return false;
  }
};

module.exports = { pool, connectDB };

