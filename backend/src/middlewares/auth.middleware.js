const { verifyToken } = require("../utils/jwt");
const Admin = require("../models/admin.model");

// Simple in-memory token blacklist (for logout/invalidation)
// In production, use Redis or database for distributed systems
const tokenBlacklist = new Map(); // Use Map to store token + expiry time

/**
 * Cleanup expired tokens from blacklist
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (now > expiry) {
      tokenBlacklist.delete(token);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

/**
 * Add token to blacklist (for logout)
 */
function blacklistToken(token) {
  // Store token with expiry time (24 hours from now)
  const expiry = Date.now() + (24 * 60 * 60 * 1000);
  tokenBlacklist.set(token, expiry);
  
  // Auto-remove after 24 hours (backup cleanup)
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Check if token is blacklisted
 */
function isTokenBlacklisted(token) {
  if (!tokenBlacklist.has(token)) {
    return false;
  }
  
  // Check if token has expired
  const expiry = tokenBlacklist.get(token);
  if (Date.now() > expiry) {
    tokenBlacklist.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Authentication middleware for admin routes
 * Verifies JWT token and attaches admin to request
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been invalidated. Please login again.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // JWT uses 'sub' field, extract admin ID from it
    const adminId = decoded.sub || decoded.id;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Fetch admin from database to ensure they still exist and are active
    const admin = await Admin.findByPk(adminId);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin account not found'
      });
    }

    // Check if admin account is active
    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Admin account is deactivated'
      });
    }

    // Attach admin to request for use in controllers
    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name || admin.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    console.error('❌ Error in authentication middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

module.exports = {
  authenticateAdmin,
  blacklistToken,
  isTokenBlacklisted,
};
