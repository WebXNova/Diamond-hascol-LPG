const Admin = require("../models/admin.model");
const { hashPassword, comparePassword } = require("../utils/password");
const { signAdminToken, verifyToken } = require("../utils/jwt");
const { blacklistToken } = require("../middlewares/auth.middleware");

/**
 * Admin login
 * POST /api/admin/auth/login
 * 
 * Body: { email: string, password: string }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({
      where: { email: email.trim().toLowerCase() }
    });

    // Always return same error message to prevent email enumeration
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if admin account is active
    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    admin.lastLoginAt = new Date();
    await admin.save().catch(() => {
      // Non-critical, continue even if update fails
    });

    // Generate JWT token
    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name || admin.email
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name || admin.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in admin login:', error);
    next(error);
  }
};

/**
 * Verify admin token
 * GET /api/admin/auth/verify
 */
const verify = async (req, res, next) => {
  try {
    // If middleware reached here, token is valid
    // req.admin is set by auth middleware
    return res.status(200).json({
      success: true,
      data: {
        admin: {
          id: req.admin.id,
          email: req.admin.email,
          name: req.admin.name || req.admin.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout admin (invalidate token)
 * POST /api/admin/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      blacklistToken(token);
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  verify,
  logout,
};
