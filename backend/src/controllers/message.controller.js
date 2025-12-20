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
    // Extract and validate required fields
    const { name, phone, message } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Sanitize phone (remove non-digits)
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 7) {
      return res.status(400).json({ error: 'Phone number is too short' });
    }

    // Convert phone to BIGINT (validate it's a valid number)
    let phoneNumber;
    try {
      phoneNumber = BigInt(phoneDigits);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Reject unknown fields
    const allowedFields = ['name', 'phone', 'message'];
    const receivedFields = Object.keys(req.body);
    const unknownFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (unknownFields.length > 0) {
      return res.status(400).json({ 
        error: `Unknown fields: ${unknownFields.join(', ')}` 
      });
    }

    // Create message with is_read = FALSE (default)
    await Message.create({
      name: name.trim(),
      phone: phoneNumber,
      message: message.trim(),
      is_read: false,
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

