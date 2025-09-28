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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      await existingMessage.addReply(buyerId, message);
      
      const updatedMessage = await Message.findById(existingMessage._id)
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .populate('property', 'title price location');
=======
=======
>>>>>>> Stashed changes
      const currentThread = existingMessage.thread || [];
      const newMessage = {
        id: Date.now() + Math.random(),
        message: message,
        sentAt: new Date().toISOString(),
        senderId: buyerId,
        sender: {
          id: buyerId,
          name: req.user.firstName + ' ' + req.user.lastName,
          email: req.user.email
        },
        isRead: false
      };
<<<<<<< Updated upstream
=======

      const updatedMessage = await existingMessage.update({
        thread: [...currentThread, newMessage],
        status: 'replied',
        lastMessageAt: new Date()
      });
>>>>>>> Stashed changes

      const updatedMessage = await existingMessage.update({
        thread: [...currentThread, newMessage],
        status: 'replied',
        lastMessageAt: new Date()
      });
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
    // Create new message thread with proper structure
    const initialMessage = {
      id: Date.now() + Math.random(),
      message: message,
      sentAt: new Date().toISOString(),
      senderId: buyerId,
      sender: {
        id: buyerId,
        name: req.user.firstName + ' ' + req.user.lastName,
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
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
    const userId = req.user.id;
    const { page = 1, limit = 10, status, role } = req.query;

=======
    const userId = req.user.id;
    const { page = 1, limit = 10, status, role } = req.query;

>>>>>>> Stashed changes
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
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
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
=======
    // Get sender info for the thread
    const senderInfo = {
      id: senderId,
      name: req.user.firstName + ' ' + req.user.lastName,
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
>>>>>>> Stashed changes
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
<<<<<<< Updated upstream
      data: updatedMessage
=======
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
>>>>>>> Stashed changes
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

// Get a specific message thread/conversation
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const messageThread = await Message.findByPk(messageId, {
      include: [
        { model: Property, attributes: ['id', 'title', 'price', 'photos'] },
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }
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

<<<<<<< Updated upstream
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
=======
    // Get sender info for the thread
    const senderInfo = {
      id: senderId,
      name: req.user.firstName + ' ' + req.user.lastName,
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
>>>>>>> Stashed changes
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
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName'] }
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

// Get a specific message thread/conversation
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const messageThread = await Message.findByPk(messageId, {
      include: [
        { model: Property, attributes: ['id', 'title', 'price', 'photos'] },
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }
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
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName'] }
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
  createRentalMessage,
  getMessages,
  getMessageThread,
  replyToMessage,
  markAsRead,
  getUnreadCount,
<<<<<<< Updated upstream
  closeMessage
};
=======
  closeMessage,
  createRentalInquiry,
  getMessageThread,
  deleteMessageThread,
  getPropertyConversations
<<<<<<< Updated upstream
};
>>>>>>> Stashed changes
=======
};
>>>>>>> Stashed changes
