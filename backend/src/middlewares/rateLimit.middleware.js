const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for order creation
 * 10 requests per 15 minutes per IP
 */
const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many order requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: 429
});

/**
 * Rate limiter for message/contact creation
 * 5 requests per 15 minutes per IP
 */
const messageRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many message requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429
});

module.exports = {
  orderRateLimiter,
  messageRateLimiter
};



