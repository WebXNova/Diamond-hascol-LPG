const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    console.error('   Request body:', req.body);
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg || 'Validation failed'
    });
  }
  console.log('✅ Validation passed for:', req.path);
  next();
};

/**
 * Sanitize phone number - remove all non-digits
 */
const sanitizePhone = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[^\d]/g, '');
};

/**
 * Validation rules for order creation
 */
const validateOrder = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters')
    .escape(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .customSanitizer(sanitizePhone)
    .isLength({ min: 7 }).withMessage('Phone number must be at least 7 digits')
    .isNumeric().withMessage('Phone number must contain only digits'),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 10 }).withMessage('Address must be at least 10 characters')
    .escape(),
  
  body('cylinderType')
    .trim()
    .notEmpty().withMessage('Cylinder type is required')
    .isIn(['Domestic', 'Commercial']).withMessage('Cylinder type must be Domestic or Commercial'),
  
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .customSanitizer((value) => {
      // Convert string to number if needed
      if (typeof value === 'string') {
        const num = parseInt(value, 10);
        return isNaN(num) ? value : num;
      }
      return value;
    })
    .isInt({ min: 1, max: 999 }).withMessage('Quantity must be an integer between 1 and 999'),
  
  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Coupon code must be at most 50 characters')
    .customSanitizer((value) => value ? value.toUpperCase() : value),
  
  // Reject unknown fields
  (req, res, next) => {
    const allowedFields = ['customerName', 'phone', 'address', 'cylinderType', 'quantity', 'couponCode'];
    const receivedFields = Object.keys(req.body);
    const unknownFields = receivedFields.filter(field => !allowedFields.includes(field));
    
    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unknown fields: ${unknownFields.join(', ')}`
      });
    }
    next();
  },
  
  handleValidationErrors
];

/**
 * Validation rules for message creation
 */
const validateMessage = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .customSanitizer(sanitizePhone)
    .isLength({ min: 7 }).withMessage('Phone number must be at least 7 digits')
    .isNumeric().withMessage('Phone number must contain only digits'),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
    .escape(),
  
  // Reject unknown fields
  (req, res, next) => {
    const allowedFields = ['name', 'phone', 'message'];
    const receivedFields = Object.keys(req.body);
    const unknownFields = receivedFields.filter(field => !allowedFields.includes(field));
    
    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unknown fields: ${unknownFields.join(', ')}`
      });
    }
    next();
  },
  
  handleValidationErrors
];

module.exports = {
  validateOrder,
  validateMessage
};

