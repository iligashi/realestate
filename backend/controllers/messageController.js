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

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get messages for a user (as buyer or seller)
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
    } else if (role === 'seller') {
      query.seller = userId;
    } else {
      // Get all messages where user is either buyer or seller
      query.$or = [
        { buyer: userId },
        { seller: userId }
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
      .populate('property', 'title price location images')
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
      .populate('property', 'title price location images')
      .populate('thread.sender', 'name email');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of this conversation
    if (message.buyer._id.toString() !== userId.toString() && 
        message.seller._id.toString() !== userId.toString()) {
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
      .populate('seller', 'name email');

    if (!messageThread) {
      return res.status(404).json({ error: 'Message thread not found' });
    }

    // Check if user is part of this conversation
    if (messageThread.buyer._id.toString() !== senderId.toString() && 
        messageThread.seller._id.toString() !== senderId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add reply to thread
    await messageThread.addReply(senderId, message.trim());

    // Get updated message with populated data
    const updatedMessage = await Message.findById(messageId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('property', 'title price location')
      .populate('thread.sender', 'name email');

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
    if (message.buyer.toString() !== userId.toString() && 
        message.seller.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await message.markAsRead(userId);

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

    const totalUnread = unreadAsSeller + unreadAsBuyer;

    // Add cache control headers
    res.set('Cache-Control', 'no-cache'); // Allow conditional requests but no caching
    
    res.json({
      unreadCount: totalUnread,
      unreadAsSeller,
      unreadAsBuyer
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
    if (message.buyer.toString() !== userId.toString() && 
        message.seller.toString() !== userId.toString()) {
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

module.exports = {
  createMessage,
  getMessages,
  getMessageThread,
  replyToMessage,
  markAsRead,
  getUnreadCount,
  closeMessage
};
