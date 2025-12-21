const Message = require("../models/message.model");

/**
 * Create a new contact message
 * POST /api/contact
 * 
 * Frontend sends:
 * {
 *   name: string,
 *   phone: string,
 *   message: string
 * }
 */
const createMessage = async (req, res, next) => {
  try {
    // Extract fields (validation middleware handles validation)
    const { name, phone, message } = req.body;

    // Sanitize phone (validation middleware already sanitized, but ensure it's digits only)
    const phoneDigits = phone.replace(/[^\d]/g, '');

    // Convert phone to BIGINT (validate it's a valid number)
    let phoneNumber;
    try {
      phoneNumber = BigInt(phoneDigits);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid phone number format' 
      });
    }

    // Create message with isRead = FALSE (default)
    await Message.create({
      name: name.trim(),
      phone: phoneNumber,
      message: message.trim(),
      isRead: false, // Use camelCase - Sequelize maps to is_read in database
    });

    // Return success response
    return res.status(201).json({
      success: true,
    });
  } catch (error) {
    // Pass error to error middleware
    next(error);
  }
};

module.exports = {
  createMessage,
};

