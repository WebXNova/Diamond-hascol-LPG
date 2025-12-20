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
    const messages = await Message.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    // Format messages for frontend
    const formattedMessages = messages.map(message => ({
      id: message.id,
      name: message.name,
      phone: message.phone.toString(),
      message: message.message,
      isRead: message.isRead,
      createdAt: message.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (error) {
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

