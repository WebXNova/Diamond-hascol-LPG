/**
 * Cloudinary Configuration Checker
 * Diagnoses Cloudinary configuration issues
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

console.log("🔍 Checking Cloudinary Configuration...\n");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("Environment Variables:");
console.log("─────────────────────────────────────────");
console.log(`CLOUDINARY_CLOUD_NAME: ${cloudName ? `"${cloudName}" (length: ${cloudName.length})` : "❌ MISSING"}`);
console.log(`CLOUDINARY_API_KEY: ${apiKey ? `"${apiKey}" (length: ${apiKey.length})` : "❌ MISSING"}`);
console.log(`CLOUDINARY_API_SECRET: ${apiSecret ? `"${apiSecret.substring(0, 10)}..." (length: ${apiSecret.length})` : "❌ MISSING"}`);
console.log("─────────────────────────────────────────\n");

// Check for common issues
const issues = [];

if (!cloudName) {
  issues.push("❌ CLOUDINARY_CLOUD_NAME is missing");
} else {
  const trimmed = cloudName.trim();
  if (trimmed !== cloudName) {
    issues.push(`⚠️  CLOUDINARY_CLOUD_NAME has whitespace: "${cloudName}" → should be "${trimmed}"`);
  }
}

if (!apiKey) {
  issues.push("❌ CLOUDINARY_API_KEY is missing");
} else {
  const trimmed = apiKey.trim();
  if (trimmed !== apiKey) {
    issues.push(`⚠️  CLOUDINARY_API_KEY has whitespace: "${apiKey}" → should be "${trimmed}"`);
  }
}

if (!apiSecret) {
  issues.push("❌ CLOUDINARY_API_SECRET is missing");
} else {
  const trimmed = apiSecret.trim();
  if (trimmed !== apiSecret) {
    issues.push(`⚠️  CLOUDINARY_API_SECRET has whitespace: "${apiSecret.substring(0, 30)}..." → should be trimmed`);
  }
  
  // Check for malformed values
  if (apiSecret.includes('CLOUDINARY_URL=')) {
    issues.push("❌ CLOUDINARY_API_SECRET contains 'CLOUDINARY_URL=' - this is WRONG!");
    issues.push("   The secret should ONLY be the secret value, not a URL format.");
    issues.push("   Extract the secret from: cloudinary://api_key:API_SECRET@cloud_name");
  }
  
  if (apiSecret.includes('cloudinary://')) {
    issues.push("❌ CLOUDINARY_API_SECRET contains 'cloudinary://' - this is WRONG!");
    issues.push("   The secret should ONLY be the secret value.");
  }
}

if (issues.length === 0) {
  console.log("✅ All Cloudinary environment variables are set correctly!\n");
  console.log("Expected .env format:");
  console.log("─────────────────────────────────────────");
  console.log("CLOUDINARY_CLOUD_NAME=your_cloud_name");
  console.log("CLOUDINARY_API_KEY=your_api_key");
  console.log("CLOUDINARY_API_SECRET=your_api_secret");
  console.log("─────────────────────────────────────────");
  console.log("\n⚠️  Make sure:");
  console.log("   • NO spaces around = signs");
  console.log("   • NO quotes around values");
  console.log("   • CLOUDINARY_API_SECRET contains ONLY the secret (not CLOUDINARY_URL=...)");
  console.log("\nAfter fixing, restart your backend server.");
} else {
  console.log("❌ Issues Found:\n");
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log("\n📝 Fix your backend/.env file:");
  console.log("─────────────────────────────────────────");
  console.log("1. Remove ALL spaces around = signs");
  console.log("2. CLOUDINARY_API_SECRET should ONLY contain the secret value");
  console.log("3. If you have CLOUDINARY_URL, extract the secret from it:");
  console.log("   Format: cloudinary://api_key:API_SECRET@cloud_name");
  console.log("   Extract the part between ':' and '@'");
  console.log("─────────────────────────────────────────");
  console.log("\nExample (CORRECT):");
  console.log("CLOUDINARY_CLOUD_NAME=duxiuthsj");
  console.log("CLOUDINARY_API_KEY=571259345963511");
  console.log("CLOUDINARY_API_SECRET=pc1wBqI9UuFNjMFf5StgLulUaF4");
  console.log("\nExample (WRONG - has spaces):");
  console.log("CLOUDINARY_CLOUD_NAME = duxiuthsj  ❌");
  console.log("CLOUDINARY_API_KEY =571259345963511  ❌");
  console.log("CLOUDINARY_API_SECRET = value  ❌");
}

process.exit(issues.length > 0 ? 1 : 0);

