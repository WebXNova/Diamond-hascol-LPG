/**
 * Centralized error handling middleware
 * Handles validation errors, database errors, and unknown errors
 */

const errorMiddleware = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Validation errors (from express-validator or custom validation)
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({
      error: err.message || 'Validation error',
    });
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({
      error: messages || 'Validation error',
    });
  }

  // Sequelize database errors
  if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(500).json({
      error: 'Database error occurred',
    });
  }

  // Custom error with status code
  if (err.status) {
    return res.status(err.status).json({
      error: err.message || 'An error occurred',
    });
  }

  // Unknown errors
  return res.status(500).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = errorMiddleware;

