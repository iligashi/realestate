const Message = require('../models/Message');
const Property = require('../models/Property');
const User = require('../models/User');

// Create a new message (buyer contacting seller)
const createMessage = async (req, res) => {
  try {
    const { propertyId, message } = req.body;
    const buyerId = req.user.id;

    // Get property and seller info
    const property = await Property.findById(propertyId).populate('owner');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const sellerId = property.owner._id;

    // Check if message already exists for this property and buyer
    const existingMessage = await Message.findOne({
      property: propertyId,
      buyer: buyerId
    });

    if (existingMessage) {
      // Add to existing thread instead of creating new message
      existingMessage.replies.push({
        sender: buyerId,
        message: message,
        timestamp: new Date()
      });
      existingMessage.lastMessageAt = new Date();
      await existingMessage.save();

      const updatedMessage = await Message.findById(existingMessage._id)
        .populate('buyer', 'firstName lastName email')
        .populate('seller', 'firstName lastName email')
        .populate('property', 'title price address');

      return res.json({
        success: true,
        message: 'Message added to existing thread',
        data: updatedMessage
      });
    }

    // Create new message thread
    const newMessage = new Message({
      property: propertyId,
      buyer: buyerId,
      seller: sellerId,
      message: message,
      replies: [],
      status: 'open',
      readBy: [buyerId],
      lastMessageAt: new Date()
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate('property', 'title price address');

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating message',
      error: error.message
    });
  }
};

// Create a new rental message (renter contacting landlord)
const createRentalMessage = async (req, res) => {
  try {
    const { propertyId, message } = req.body;
    const renterId = req.user.id;

    // Get property and landlord info
    const property = await Property.findById(propertyId).populate('owner');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const landlordId = property.owner._id;

    // Check if message already exists for this property and renter
    const existingMessage = await Message.findOne({
      property: propertyId,
      renter: renterId
    });

    if (existingMessage) {
      // Add to existing thread
      existingMessage.replies.push({
        sender: renterId,
        message: message,
        timestamp: new Date()
      });
      existingMessage.lastMessageAt = new Date();
      await existingMessage.save();

      return res.json({
        success: true,
        message: 'Message added to existing thread',
        data: existingMessage
      });
    }

    // Create new message thread
    const newMessage = new Message({
      property: propertyId,
      renter: renterId,
      landlord: landlordId,
      message: message,
      replies: [],
      status: 'open',
      readBy: [renterId],
      lastMessageAt: new Date()
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Rental message created successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error creating rental message:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating rental message',
      error: error.message
    });
  }
};

// Get messages for the authenticated user
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query;

    let query = {};
    
    if (role === 'buyer') {
      query.buyer = userId;
    } else if (role === 'seller') {
      query.seller = userId;
    } else if (role === 'renter') {
      query.renter = userId;
    } else if (role === 'landlord') {
      query.landlord = userId;
    } else {
      // Get all messages where user is involved
      query.$or = [
        { buyer: userId },
        { seller: userId },
        { renter: userId },
        { landlord: userId }
      ];
    }

    const messages = await Message.find(query)
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate('renter', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .populate('property', 'title price address photos')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Get a specific message thread
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId)
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate('renter', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .populate('property', 'title price address photos');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message thread not found'
      });
    }

    // Check if user is part of this conversation
    const isParticipant = message.buyer?._id?.toString() === userId ||
                         message.seller?._id?.toString() === userId ||
                         message.renter?._id?.toString() === userId ||
                         message.landlord?._id?.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to message thread'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message thread:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message thread',
      error: error.message
    });
  }
};

// Get conversations for a specific property
const getPropertyConversations = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user is the owner or has permission
    if (property.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to property conversations'
      });
    }

    const conversations = await Message.find({ property: propertyId })
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate('renter', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching property conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property conversations',
      error: error.message
    });
  }
};

// Reply to a message
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const messageThread = await Message.findById(messageId);
    if (!messageThread) {
      return res.status(404).json({
        success: false,
        message: 'Message thread not found'
      });
    }

    // Check if user is part of this conversation
    const isParticipant = messageThread.buyer?.toString() === userId ||
                         messageThread.seller?.toString() === userId ||
                         messageThread.renter?.toString() === userId ||
                         messageThread.landlord?.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reply to this message'
      });
    }

    // Add reply
    messageThread.replies.push({
      sender: userId,
      message: message,
      timestamp: new Date()
    });
    messageThread.lastMessageAt = new Date();
    messageThread.readBy = [userId]; // Reset read status

    await messageThread.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate('renter', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .populate('property', 'title price address');

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reply',
      error: error.message
    });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadMessages = await Message.find({
      $or: [
        { buyer: userId },
        { seller: userId },
        { renter: userId },
        { landlord: userId }
      ],
      readBy: { $ne: userId }
    });

    res.json({
      success: true,
      data: {
        unreadCount: unreadMessages.length
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// Close a message thread
const closeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is part of this conversation
    const isParticipant = message.buyer?.toString() === userId ||
                         message.seller?.toString() === userId ||
                         message.renter?.toString() === userId ||
                         message.landlord?.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to close this message'
      });
    }

    message.status = 'closed';
    await message.save();

    res.json({
      success: true,
      message: 'Message thread closed'
    });
  } catch (error) {
    console.error('Error closing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing message',
      error: error.message
    });
  }
};

// Delete a message thread
const deleteMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is part of this conversation
    const isParticipant = message.buyer?.toString() === userId ||
                         message.seller?.toString() === userId ||
                         message.renter?.toString() === userId ||
                         message.landlord?.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this message'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message thread deleted'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

module.exports = {
  createMessage,
  createRentalMessage,
  getMessages,
  getMessageThread,
  replyToMessage,
  markAsRead,
  getUnreadCount,
  closeMessage,
  deleteMessageThread,
  getPropertyConversations
};