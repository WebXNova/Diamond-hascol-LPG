/**
 * One-time admin bootstrap utility
 * Creates exactly one admin on first server startup if no admin exists
 * Uses environment variables: ADMIN_EMAIL, ADMIN_PASSWORD
 * 
 * Security:
 * - Only runs at server startup
 * - Never logs passwords
 * - Only creates admin if none exists
 * - Uses bcrypt for password hashing
 */

const Admin = require("../models/admin.model");
const { hashPassword } = require("./password");

/**
 * Bootstrap admin user from environment variables
 * Only creates admin if no admin exists in database
 * 
 * @returns {Promise<void>}
 */
async function bootstrapAdmin() {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.count();
    
    if (adminCount > 0) {
      console.log(`✅ Admin bootstrap: ${adminCount} admin(s) already exist. Skipping auto-creation.`);
      return;
    }

    // Read credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if credentials are provided
    if (!adminEmail || !adminPassword) {
      console.warn("⚠️  Admin bootstrap: ADMIN_EMAIL and/or ADMIN_PASSWORD not set in environment variables.");
      console.warn("💡 To create the first admin automatically, set:");
      console.warn("   ADMIN_EMAIL=admin@example.com");
      console.warn("   ADMIN_PASSWORD=YourSecurePassword123");
      console.warn("💡 Alternatively, use: node scripts/create-admin.js <email> <password> [name]");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      console.error("❌ Admin bootstrap: Invalid email format in ADMIN_EMAIL");
      return;
    }

    // Validate password length
    if (adminPassword.length < 8) {
      console.error("❌ Admin bootstrap: Password must be at least 8 characters long");
      return;
    }

    // Hash password (never store plain text)
    const passwordHash = await hashPassword(adminPassword);

    // Extract name from email (username part) or use default
    const name = adminEmail.split('@')[0] || 'Admin';

    // Create admin
    const admin = await Admin.create({
      email: adminEmail.trim().toLowerCase(),
      name: name,
      passwordHash: passwordHash,
      isActive: true,
    });

    console.log("✅ Admin bootstrap: Created first admin successfully");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   ID: ${admin.id}`);
    console.log("🔒 Security: Password has been hashed and stored securely");
    console.log("⚠️  Important: Remove ADMIN_PASSWORD from .env after first login for security");

  } catch (error) {
    // Log error but don't crash server
    console.error("❌ Admin bootstrap: Failed to create admin:", error.message);
    console.error("💡 You can create an admin manually using: node scripts/create-admin.js <email> <password> [name]");
  }
}

module.exports = {
  bootstrapAdmin,
};

