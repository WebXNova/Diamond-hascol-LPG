/**
 * Structured logging utility
 * Redacts sensitive data automatically
 * Provides consistent log format
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Redact sensitive fields from objects
 * @param {Object} obj - Object to redact
 * @returns {Object} Object with sensitive fields redacted
 */
function redactSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'passwordHash', 'token', 'authorization', 'phone', 'address', 'email'];
  const redacted = { ...obj };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key]);
    }
  }
  
  return redacted;
}

/**
 * Safe logger - automatically redacts sensitive data
 */
const logger = {
  /**
   * Log info message
   */
  info: (message, data = {}) => {
    const redacted = redactSensitive(data);
    console.log(`[INFO] ${message}`, Object.keys(redacted).length > 0 ? redacted : '');
  },

  /**
   * Log error message
   */
  error: (message, error = null) => {
    if (isProduction) {
      // In production, log minimal info
      console.error(`[ERROR] ${message}`, error ? { message: error.message, stack: '[REDACTED]' } : '');
    } else {
      // In development, log full details
      console.error(`[ERROR] ${message}`, error || '');
    }
  },

  /**
   * Log warning message
   */
  warn: (message, data = {}) => {
    const redacted = redactSensitive(data);
    console.warn(`[WARN] ${message}`, Object.keys(redacted).length > 0 ? redacted : '');
  },

  /**
   * Log debug message (only in development)
   */
  debug: (message, data = {}) => {
    if (!isProduction) {
      const redacted = redactSensitive(data);
      console.log(`[DEBUG] ${message}`, Object.keys(redacted).length > 0 ? redacted : '');
    }
  },

  /**
   * Log request (redacts sensitive headers)
   */
  request: (req) => {
    if (isProduction) {
      // Minimal logging in production
      logger.info(`${req.method} ${req.path}`);
    } else {
      // Detailed logging in development
      const safeHeaders = { ...req.headers };
      delete safeHeaders.authorization;
      delete safeHeaders.cookie;
      logger.debug(`${req.method} ${req.path}`, {
        headers: safeHeaders,
        query: req.query,
        body: redactSensitive(req.body)
      });
    }
  }
};

module.exports = logger;

