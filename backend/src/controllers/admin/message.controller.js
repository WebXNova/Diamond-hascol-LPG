const Message = require("../../models/message.model");

/**
 * Get all messages (with optional filtering)
 * GET /api/admin/messages
 */
const getMessages = async (req, res, next) => {
  try {
    const { isRead, limit = 100, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    // Fetch messages from database
    // Use Sequelize.literal for ordering to ensure it works with underscored fields
    const { Sequelize } = require('sequelize');
    const messages = await Message.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[Sequelize.literal('created_at'), 'DESC']],
    });

    console.log(`📨 Fetched ${messages.length} messages from database`);

    // Format messages for frontend with safe parsing
    // Sequelize returns camelCase properties even with underscored: true
    const formattedMessages = messages.map(message => {
      // Safely get createdAt - Sequelize returns it as createdAt (camelCase)
      const createdAt = message.createdAt || message.get('createdAt') || message.get('created_at') || new Date();
      
      return {
        id: message.id || 0,
        name: message.name || '',
        phone: message.phone ? message.phone.toString() : '',
        message: message.message || '',
        isRead: message.isRead || false,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    next(error);
  }
};

/**
 * Mark message as read
 * PATCH /api/admin/messages/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Update isRead status
    message.isRead = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: {
        id: message.id,
        isRead: message.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message
 * DELETE /api/admin/messages/:id
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    await message.destroy();

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  markAsRead,
  deleteMessage,
};

