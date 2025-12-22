/**
 * Environment variable validation
 * Validates required environment variables at startup
 * Fails fast with clear error messages
 */

function validateEnv() {
  const errors = [];
  const warnings = [];

  // Required in all environments
  const required = {
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  // Check required variables
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate JWT_SECRET strength
  if (required.JWT_SECRET && required.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET should be at least 16 characters long for security');
  }

  // Cloudinary (required for image uploads, but not fatal if missing)
  const cloudinaryVars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  const hasAllCloudinary = Object.values(cloudinaryVars).every(v => v && v.trim() !== '');
  if (!hasAllCloudinary) {
    warnings.push('Cloudinary environment variables not set - image uploads will fail');
  }

  // Production-specific checks
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    if (!process.env.FRONTEND_URL && !process.env.ADMIN_CORS_ORIGIN) {
      warnings.push('FRONTEND_URL or ADMIN_CORS_ORIGIN not set - admin CORS will allow all origins');
    }
    
    if (required.JWT_SECRET === 'dev-insecure-jwt-secret-change-me') {
      errors.push('JWT_SECRET must be changed from default value in production');
    }
  }

  // Report errors (fatal)
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`   ${err}`));
    console.error('\n💡 Please check your .env file and set all required variables');
    throw new Error('Environment validation failed');
  }

  // Report warnings (non-fatal)
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warn => console.warn(`   ${warn}`));
  }

  console.log('✅ Environment validation passed');
}

module.exports = { validateEnv };

