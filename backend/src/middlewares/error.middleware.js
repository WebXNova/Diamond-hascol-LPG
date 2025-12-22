/**
 * Centralized error handling middleware
 * Handles validation errors, database errors, and unknown errors
 * All errors follow standardized format: { success: false, error: "message" }
 * Production-safe: Never leaks internal error details
 */

const errorMiddleware = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log error for debugging (detailed in dev, redacted in prod)
  if (isProduction) {
    // In production, log minimal info (no stack traces, no sensitive data)
    console.error('Error:', {
      message: err.message,
      status: err.status || 500,
      path: req.path,
      method: req.method
    });
  } else {
    // In development, log full error details
    console.error('Error:', err);
  }

  // Validation errors (from express-validator or custom validation)
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Validation error',
    });
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({
      success: false,
      error: messages || 'Validation error',
    });
  }

  // Sequelize database errors
  if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(500).json({
      success: false,
      error: 'Database error occurred',
    });
  }

  // Custom error with status code
  if (err.status) {
    // Only return custom message if it's safe (4xx errors are usually safe)
    // For 5xx errors, use generic message in production
    if (err.status >= 500 && isProduction) {
      return res.status(err.status).json({
        success: false,
        error: 'An internal error occurred',
      });
    }
    return res.status(err.status).json({
      success: false,
      error: err.message || 'An error occurred',
    });
  }

  // Unknown errors (500) - NEVER leak internal details in production
  return res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
  });
};

module.exports = errorMiddleware;

