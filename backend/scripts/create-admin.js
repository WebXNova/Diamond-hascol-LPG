/**
 * Script to create admin user
 * Usage: node scripts/create-admin.js <email> <password> <name>
 * 
 * Example: node scripts/create-admin.js admin@example.com SecurePass123 "Admin Name"
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../src/config/db");
const Admin = require("../src/models/admin.model");
const { hashPassword } = require("../src/utils/password");

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("❌ Usage: node scripts/create-admin.js <email> <password> [name]");
    console.error("   Example: node scripts/create-admin.js admin@example.com SecurePass123 \"Admin Name\"");
    process.exit(1);
  }

  const email = args[0].trim().toLowerCase();
  const password = args[1];
  const name = args[2] || email.split('@')[0];

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("❌ Invalid email format");
    process.exit(1);
  }

  // Validate password
  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters long");
    process.exit(1);
  }

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync admin model (create table if doesn't exist)
    await sequelize.sync({ alter: false });
    console.log("✅ Admin table synced");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      console.error(`❌ Admin with email ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin
    const admin = await Admin.create({
      email,
      name,
      passwordHash,
      isActive: true,
    });

    console.log("✅ Admin created successfully!");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Active: ${admin.isActive}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    console.error(error);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

createAdmin();

