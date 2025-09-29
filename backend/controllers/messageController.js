const { Message, Property, User } = require('../models');
const { Op } = require('sequelize');

// Create a new message (buyer contacting seller)
const createMessage = async (req, res) => {
  try {
    const { propertyId, subject, message } = req.body;
    const buyerId = req.user.id;

    // Validate input
    if (!propertyId || !subject || !message) {
      return res.status(400).json({ 
        error: 'Property ID, subject, and message are required' 
      });
    }

    // Get property and verify it exists
    const property = await Property.findByPk(propertyId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'email'] }]
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if buyer is not the same as seller
    if (buyerId === property.owner.id) {
      return res.status(400).json({ 
        error: 'You cannot message yourself about your own property' 
      });
    }

    // Check if message already exists for this buyer-seller-property combination
    const existingMessage = await Message.findOne({
      where: {
        property_id: propertyId,
        buyer_id: buyerId,
        seller_id: property.owner.id
      }
    });

    if (existingMessage) {
      // Add to existing thread instead of creating new message
      const currentThread = existingMessage.thread || [];
      const newMessage = {
        id: Date.now() + Math.random(),
        message: message,
        sentAt: new Date().toISOString(),
        senderId: buyerId,
        sender: {
          id: buyerId,
          name: req.user.first_name + ' ' + req.user.last_name,
          email: req.user.email
        },
        isRead: false
      };

      const updatedMessage = await existingMessage.update({
        thread: [...currentThread, newMessage],
        status: 'replied',
        lastMessageAt: new Date()
      });

      // Emit WebSocket event for real-time notification
      if (global.socketServer) {
        global.socketServer.emitNewMessage({
          messageId: updatedMessage.id,
          buyer: updatedMessage.buyer_id,
          seller: updatedMessage.seller_id,
          message: message,
          sender: {
            id: updatedMessage.buyer_id,
            name: req.user.first_name + ' ' + req.user.last_name,
            email: req.user.email
          }
        });
      }

      return res.json({
        message: 'Message added to existing thread',
        data: {
          message_id: updatedMessage.id,
          buyer: updatedMessage.buyer_id,
          seller: updatedMessage.seller_id,
          property: updatedMessage.property_id,
          buyer_info: {
            id: updatedMessage.buyer_id,
            name: req.user.first_name + ' ' + req.user.last_name
          }
        }
      });
    }

    // Create new message thread with proper structure
    const initialMessage = {
      id: Date.now() + Math.random(),
      message: message,
      sentAt: new Date().toISOString(),
      senderId: buyerId,
      sender: {
        id: buyerId,
        name: req.user.first_name + ' ' + req.user.last_name,
        email: req.user.email
      },
      isRead: false
    };

    const newMessage = await Message.create({
      property_id: propertyId,
      buyer_id: buyerId,
      seller_id: property.owner.id,
      subject: subject,
      message: message,
      status: 'new',
      thread: [initialMessage],
      readBy: {
        buyer: true,
        seller: false
      },
      lastMessageAt: new Date()
    });

    const populatedMessage = await Message.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: {
        message_id: populatedMessage.id,
        buyer: populatedMessage.buyer_id,
        seller: populatedMessage.seller_id,
        property: populatedMessage.property_id,
        buyer_info: {
          id: populatedMessage.buyer_id,
          name: populatedMessage.buyer.first_name + ' ' + populatedMessage.buyer.last_name
        }
      }
    });

  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get messages for a user (as buyer, seller, renter, or landlord)
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, role } = req.query;

    let whereClause = {};

    // Handle role-based filtering
    if (role === 'seller') {
      whereClause = {
        seller_id: userId
      };
    } else if (role === 'buyer') {
      whereClause = {
        buyer_id: userId
      };
    } else if (role === 'renter') {
      whereClause = {
        renter_id: userId
      };
    } else if (role === 'landlord') {
      whereClause = {
        landlord_id: userId
      };
    } else {
      // Default: get all messages for the user
      whereClause = {
        [Op.or]: [
          { buyer_id: userId },
          { seller_id: userId },
          { renter_id: userId },
          { landlord_id: userId }
        ]
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const messages = await Message.findAndCountAll({
      where: whereClause,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'price'] },
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'renter', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'landlord', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      messages: messages.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(messages.count / parseInt(limit)),
        totalMessages: messages.count
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};


// Reply to a message
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const messageThread = await Message.findByPk(messageId, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'renter', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'landlord', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    if (!messageThread) {
      return res.status(404).json({ error: 'Message thread not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      (messageThread.buyerId === senderId) ||
      (messageThread.sellerId === senderId) ||
      (messageThread.renterId === senderId) ||
      (messageThread.landlordId === senderId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to reply to this message' });
    }

    // Get sender info for the thread
    const senderInfo = {
      id: senderId,
      name: req.user.first_name + ' ' + req.user.last_name,
      email: req.user.email
    };

    // Add reply to thread with proper structure
    const currentThread = messageThread.thread || [];
    const newMessage = {
      id: Date.now() + Math.random(), // Generate unique ID for the message
      message: message,
      sentAt: new Date().toISOString(),
      senderId: senderId,
      sender: senderInfo,
      isRead: false
    };

    const updatedThread = [...currentThread, newMessage];

    // Update the message with new thread and mark as replied
    const updatedMessage = await messageThread.update({
      thread: updatedThread,
      status: 'replied',
      lastMessageAt: new Date()
    });

    // Update read status - mark as unread for the recipient
    const readBy = messageThread.readBy || {};
    if (messageThread.buyerId === senderId) {
      readBy.seller = false;
    } else if (messageThread.sellerId === senderId) {
      readBy.buyer = false;
    } else if (messageThread.renterId === senderId) {
      readBy.landlord = false;
    } else if (messageThread.landlordId === senderId) {
      readBy.renter = false;
    }

    await updatedMessage.update({ readBy });

    // Determine recipient for notification
    let recipientId = null;
    if (messageThread.buyerId === senderId) {
      recipientId = messageThread.sellerId;
    } else if (messageThread.sellerId === senderId) {
      recipientId = messageThread.buyerId;
    } else if (messageThread.renterId === senderId) {
      recipientId = messageThread.landlordId;
    } else if (messageThread.landlordId === senderId) {
      recipientId = messageThread.renterId;
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        messageId: updatedMessage.id,
        buyer: updatedMessage.buyerId,
        seller: updatedMessage.sellerId,
        renter: updatedMessage.renterId,
        landlord: updatedMessage.landlordId,
        thread: updatedMessage.thread,
        recipientId: recipientId,
        lastMessage: newMessage
      }
    });

  } catch (error) {
    console.error('Reply to message error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      (message.buyerId === userId) ||
      (message.sellerId === userId) ||
      (message.renterId === userId) ||
      (message.landlordId === userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }

    // Update read status
    const readBy = message.readBy || {};
    readBy[userId] = new Date();

    await message.update({
      readBy: readBy,
      status: message.status === 'new' ? 'read' : message.status
    });

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.count({
      where: {
        [Op.or]: [
          { buyerId: userId },
          { sellerId: userId },
          { renterId: userId },
          { landlord_id: userId }
        ],
        status: 'new'
      }
    });

    res.json({ unreadCount });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Close a message thread
const closeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      (message.buyerId === userId) ||
      (message.sellerId === userId) ||
      (message.renterId === userId) ||
      (message.landlordId === userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to close this message' });
    }

    await message.update({ status: 'closed' });

    res.json({ message: 'Message thread closed' });

  } catch (error) {
    console.error('Close message error:', error);
    res.status(500).json({ error: 'Failed to close message' });
  }
};

// Create rental inquiry message
const createRentalInquiry = async (req, res) => {
  try {
    const { propertyId, subject, message } = req.body;
    const renterId = req.user.id;

    // Validate input
    if (!propertyId || !subject || !message) {
      return res.status(400).json({ 
        error: 'Property ID, subject, and message are required' 
      });
    }

    // Get property and verify it exists
    const property = await Property.findByPk(propertyId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'email'] }]
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if renter is not the same as landlord
    if (renterId === property.ownerId) {
      return res.status(400).json({ 
        error: 'You cannot message yourself about your own property' 
      });
    }

    // Check if message already exists for this renter-landlord-property combination
    const existingMessage = await Message.findOne({
      where: {
        propertyId: propertyId,
        renterId: renterId,
        landlordId: property.ownerId
      }
    });

    if (existingMessage) {
      // Add to existing thread instead of creating new message
      const updatedMessage = await existingMessage.update({
        thread: [
          ...(existingMessage.thread || []),
          {
            message: message,
            sentAt: new Date(),
            senderId: renterId
          }
        ]
      });

      return res.json({
        message: 'Inquiry added to existing thread',
        data: {
          messageId: updatedMessage.id,
          renter: updatedMessage.renterId,
          landlord: updatedMessage.landlordId,
          property: updatedMessage.propertyId,
          renterInfo: {
            id: updatedMessage.renterId,
            name: req.user.first_name + ' ' + req.user.last_name
          }
        }
      });
    }

    // Create new message thread
    const newMessage = await Message.create({
      propertyId: propertyId,
      renterId: renterId,
      landlordId: property.ownerId,
      subject: subject,
      message: message,
      status: 'new',
      thread: [
        {
          message: message,
          sentAt: new Date(),
          senderId: renterId
        }
      ]
    });

    const populatedMessage = await Message.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'renter', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'landlord', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Rental inquiry sent successfully',
      data: {
        messageId: populatedMessage.id,
        renter: populatedMessage.renterId,
        landlord: populatedMessage.landlordId,
        property: populatedMessage.propertyId,
        renterInfo: {
          id: populatedMessage.renterId,
          name: populatedMessage.renter.first_name + ' ' + populatedMessage.renter.last_name
        }
      }
    });

  } catch (error) {
    console.error('Create rental inquiry error:', error);
    res.status(500).json({ error: 'Failed to send rental inquiry' });
  }
};

// Get a specific message thread/conversation
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const messageThread = await Message.findByPk(messageId, {
      include: [
        { model: Property, attributes: ['id', 'title', 'price', 'photos'] },
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'] },
        { model: User, as: 'renter', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'] },
        { model: User, as: 'landlord', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'] }
      ]
    });

    if (!messageThread) {
      return res.status(404).json({ error: 'Message thread not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      (messageThread.buyerId === userId) ||
      (messageThread.sellerId === userId) ||
      (messageThread.renterId === userId) ||
      (messageThread.landlordId === userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    res.json({
      success: true,
      data: {
        messageId: messageThread.id,
        property: messageThread.property,
        buyer: messageThread.buyer,
        seller: messageThread.seller,
        renter: messageThread.renter,
        landlord: messageThread.landlord,
        subject: messageThread.subject,
        status: messageThread.status,
        thread: messageThread.thread || [],
        readBy: messageThread.readBy || {},
        lastMessageAt: messageThread.lastMessageAt,
        createdAt: messageThread.createdAt,
        updatedAt: messageThread.updatedAt
      }
    });

  } catch (error) {
    console.error('Get message thread error:', error);
    res.status(500).json({ error: 'Failed to fetch message thread' });
  }
};

// Delete a message thread/conversation
const deleteMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const messageThread = await Message.findByPk(messageId);

    if (!messageThread) {
      return res.status(404).json({ error: 'Message thread not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      (messageThread.buyerId === userId) ||
      (messageThread.sellerId === userId) ||
      (messageThread.renterId === userId) ||
      (messageThread.landlordId === userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to delete this conversation' });
    }

    // Soft delete by marking as closed, or hard delete
    await messageThread.destroy();

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete message thread error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

// Get conversation history for a specific property
const getPropertyConversations = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const conversations = await Message.findAll({
      where: {
        property_id: propertyId,
        [Op.or]: [
          { buyer_id: userId },
          { seller_id: userId },
          { renter_id: userId },
          { landlord_id: userId }
        ]
      },
      include: [
        { model: Property, attributes: ['id', 'title', 'price'] },
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'renter', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'landlord', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    res.json({
      success: true,
      conversations: conversations
    });

  } catch (error) {
    console.error('Get property conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch property conversations' });
  }
};

module.exports = {
  createMessage,
  getMessages,
  replyToMessage,
  markAsRead,
  getUnreadCount,
  closeMessage,
  createRentalInquiry,
  getMessageThread,
  deleteMessageThread,
  getPropertyConversations
};
