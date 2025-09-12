const Message = require('../models/Message');
const Property = require('../models/Property');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new message (buyer contacting seller)
const createMessage = async (req, res) => {
  try {
    const { propertyId, subject, message } = req.body;
    const buyerId = req.user._id;

    // Validate input
    if (!propertyId || !subject || !message) {
      return res.status(400).json({ 
        error: 'Property ID, subject, and message are required' 
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ 
        error: 'Invalid property ID format' 
      });
    }

    // Get property and verify it exists
    const property = await Property.findById(propertyId).populate('owner', 'name email');
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if buyer is not the same as seller
    if (buyerId.toString() === property.owner._id.toString()) {
      return res.status(400).json({ 
        error: 'You cannot message yourself about your own property' 
      });
    }

    // Check if message already exists for this buyer-seller-property combination
    const existingMessage = await Message.findOne({
      property: propertyId,
      buyer: buyerId,
      seller: property.owner._id
    });

    if (existingMessage) {
      // Add to existing thread instead of creating new message
      await existingMessage.addReply(buyerId, message);
      
      const updatedMessage = await Message.findById(existingMessage._id)
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .populate('property', 'title price location');

      // Emit WebSocket event for real-time notification
      if (global.socketServer) {
        global.socketServer.emitNewMessage({
          messageId: updatedMessage._id,
          buyer: updatedMessage.buyer._id,
          seller: updatedMessage.seller._id,
          message: message,
          sender: {
            id: updatedMessage.buyer._id,
            name: updatedMessage.buyer.name,
            email: updatedMessage.buyer.email
          }
        });
      }

      return res.status(200).json({
        message: 'Message added to existing conversation',
        data: updatedMessage
      });
    }

    // Create new message
    const newMessage = new Message({
      property: propertyId,
      buyer: buyerId,
      seller: property.owner._id,
      subject,
      message,
      thread: [{
        sender: buyerId,
        message: message,
        sentAt: new Date(),
        isRead: false
      }]
    });

    await newMessage.save();

    // Populate the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('property', 'title price location');

    // Emit WebSocket event for real-time notification
    if (global.socketServer) {
      global.socketServer.emitNewMessage({
        messageId: populatedMessage._id,
        buyer: populatedMessage.buyer._id,
        seller: populatedMessage.seller._id,
        message: populatedMessage.message,
        sender: {
          id: populatedMessage.buyer._id,
          name: populatedMessage.buyer.name,
          email: populatedMessage.buyer.email
        }
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get messages for a user (as buyer, seller, renter, or landlord)
const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    // Normalize empty query parameters to prevent duplicate cache keys
    const { role, status, page = 1, limit = 10 } = req.query;
    const normalizedStatus = status || undefined; // Convert empty string to undefined

    // Build query based on role
    let query = {};
    if (role === 'buyer') {
      query.buyer = userId;
      query.messageType = 'sale';
    } else if (role === 'seller') {
      query.seller = userId;
      query.messageType = 'sale';
    } else if (role === 'renter') {
      query.renter = userId;
      query.messageType = 'rental';
    } else if (role === 'landlord') {
      query.landlord = userId;
      query.messageType = 'rental';
    } else {
      // Get all messages where user is either buyer, seller, renter, or landlord
      query.$or = [
        { buyer: userId },
        { seller: userId },
        { renter: userId },
        { landlord: userId }
      ];
    }

    // Add status filter if provided
    if (normalizedStatus) {
      query.status = normalizedStatus;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages with pagination
    const messages = await Message.find(query)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('renter', 'name email')
      .populate('landlord', 'name email')
      .populate('property', 'title price location images')
      .populate('rentalApplication', 'status applicationDate')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Message.countDocuments(query);

    // Add cache control headers
    res.set('Cache-Control', 'no-cache'); // Allow conditional requests but no caching
    
    res.json({
      messages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Get a specific message thread
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('renter', 'name email')
      .populate('landlord', 'name email')
      .populate('property', 'title price location images')
      .populate('rentalApplication', 'status applicationDate')
      .populate('thread.sender', 'name email');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = (
      (message.buyer && message.buyer._id.toString() === userId.toString()) ||
      (message.seller && message.seller._id.toString() === userId.toString()) ||
      (message.renter && message.renter._id.toString() === userId.toString()) ||
      (message.landlord && message.landlord._id.toString() === userId.toString())
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read for the current user
    await message.markAsRead(userId);

    res.json({ message });

  } catch (error) {
    console.error('Error fetching message thread:', error);
    res.status(500).json({ error: 'Failed to fetch message thread' });
  }
};

// Reply to a message
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const messageThread = await Message.findById(messageId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('renter', 'name email')
      .populate('landlord', 'name email');

    if (!messageThread) {
      return res.status(404).json({ error: 'Message thread not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = (
      (messageThread.buyer && messageThread.buyer._id.toString() === senderId.toString()) ||
      (messageThread.seller && messageThread.seller._id.toString() === senderId.toString()) ||
      (messageThread.renter && messageThread.renter._id.toString() === senderId.toString()) ||
      (messageThread.landlord && messageThread.landlord._id.toString() === senderId.toString())
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add reply to thread
    await messageThread.addReply(senderId, message.trim());

    // Get updated message with populated data
    const updatedMessage = await Message.findById(messageId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('renter', 'name email')
      .populate('landlord', 'name email')
      .populate('property', 'title price location')
      .populate('thread.sender', 'name email');

    // Emit WebSocket event for real-time notification
    if (global.socketServer) {
      const recipientId = updatedMessage.buyer ? updatedMessage.buyer._id : updatedMessage.renter._id;
      const senderId = updatedMessage.seller ? updatedMessage.seller._id : updatedMessage.landlord._id;
      
      global.socketServer.emitNewMessage({
        messageId: updatedMessage._id,
        buyer: updatedMessage.buyer?._id,
        seller: updatedMessage.seller?._id,
        renter: updatedMessage.renter?._id,
        landlord: updatedMessage.landlord?._id,
        message: message.trim(),
        sender: {
          id: senderId,
          name: req.user.name,
          email: req.user.email
        }
      });
    }

    res.json({
      message: 'Reply sent successfully',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = (
      (message.buyer && message.buyer.toString() === userId.toString()) ||
      (message.seller && message.seller.toString() === userId.toString()) ||
      (message.renter && message.renter.toString() === userId.toString()) ||
      (message.landlord && message.landlord.toString() === userId.toString())
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await message.markAsRead(userId);

    // Emit WebSocket event for read receipt
    if (global.socketServer) {
      global.socketServer.emitMessageRead(messageId, {
        id: userId,
        name: req.user.name
      });
    }

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Get unread message count for notifications
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count unread messages where user is the seller
    const unreadAsSeller = await Message.countDocuments({
      seller: userId,
      'readBy.seller': false,
      status: { $ne: 'closed' }
    });

    // Count unread messages where user is the buyer
    const unreadAsBuyer = await Message.countDocuments({
      buyer: userId,
      'readBy.buyer': false,
      status: { $ne: 'closed' }
    });

    // Count unread messages where user is the landlord
    const unreadAsLandlord = await Message.countDocuments({
      landlord: userId,
      'readBy.landlord': false,
      status: { $ne: 'closed' }
    });

    // Count unread messages where user is the renter
    const unreadAsRenter = await Message.countDocuments({
      renter: userId,
      'readBy.renter': false,
      status: { $ne: 'closed' }
    });

    const totalUnread = unreadAsSeller + unreadAsBuyer + unreadAsLandlord + unreadAsRenter;

    // Add cache control headers
    res.set('Cache-Control', 'no-cache'); // Allow conditional requests but no caching
    
    res.json({
      unreadCount: totalUnread,
      unreadAsSeller,
      unreadAsBuyer,
      unreadAsLandlord,
      unreadAsRenter
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Close a message thread
const closeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of this conversation
    const isParticipant = (
      (message.buyer && message.buyer.toString() === userId.toString()) ||
      (message.seller && message.seller.toString() === userId.toString()) ||
      (message.renter && message.renter.toString() === userId.toString()) ||
      (message.landlord && message.landlord.toString() === userId.toString())
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    message.status = 'closed';
    await message.save();

    res.json({ message: 'Message thread closed' });

  } catch (error) {
    console.error('Error closing message:', error);
    res.status(500).json({ error: 'Failed to close message' });
  }
};

// Create a rental message (renter contacting landlord)
const createRentalMessage = async (req, res) => {
  try {
    const { propertyId, subject, message, rentalApplicationId } = req.body;
    const renterId = req.user._id;

    // Validate input
    if (!propertyId || !subject || !message) {
      return res.status(400).json({ 
        error: 'Property ID, subject, and message are required' 
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ 
        error: 'Invalid property ID format' 
      });
    }

    // Get property and verify it exists
    const property = await Property.findById(propertyId).populate('owner', 'name email');
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if renter is not the same as landlord
    if (renterId.toString() === property.owner._id.toString()) {
      return res.status(400).json({ 
        error: 'You cannot message yourself about your own property' 
      });
    }

    // Check if message already exists for this renter-landlord-property combination
    const existingMessage = await Message.findOne({
      property: propertyId,
      renter: renterId,
      landlord: property.owner._id,
      messageType: 'rental'
    });

    if (existingMessage) {
      // Add to existing thread instead of creating new message
      await existingMessage.addReply(renterId, message);
      
      const updatedMessage = await Message.findById(existingMessage._id)
        .populate('renter', 'name email')
        .populate('landlord', 'name email')
        .populate('property', 'title price location')
        .populate('rentalApplication', 'status applicationDate');

      // Emit WebSocket event for real-time notification
      if (global.socketServer) {
        global.socketServer.emitNewMessage({
          messageId: updatedMessage._id,
          renter: updatedMessage.renter._id,
          landlord: updatedMessage.landlord._id,
          message: message,
          sender: {
            id: updatedMessage.renter._id,
            name: updatedMessage.renter.name,
            email: updatedMessage.renter.email
          }
        });
      }

      return res.status(200).json({
        message: 'Message added to existing conversation',
        data: updatedMessage
      });
    }

    // Create new rental message
    const newMessage = new Message({
      property: propertyId,
      renter: renterId,
      landlord: property.owner._id,
      messageType: 'rental',
      rentalApplication: rentalApplicationId || null,
      subject,
      message,
      thread: [{
        sender: renterId,
        message: message,
        sentAt: new Date(),
        isRead: false
      }]
    });

    await newMessage.save();

    // Populate the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('renter', 'name email')
      .populate('landlord', 'name email')
      .populate('property', 'title price location')
      .populate('rentalApplication', 'status applicationDate');

    // Emit WebSocket event for real-time notification
    if (global.socketServer) {
      global.socketServer.emitNewMessage({
        messageId: populatedMessage._id,
        renter: populatedMessage.renter._id,
        landlord: populatedMessage.landlord._id,
        message: populatedMessage.message,
        sender: {
          id: populatedMessage.renter._id,
          name: populatedMessage.renter.name,
          email: populatedMessage.renter.email
        }
      });
    }

    res.status(201).json({
      message: 'Rental message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error creating rental message:', error);
    res.status(500).json({ error: 'Failed to send rental message' });
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
  closeMessage
};
