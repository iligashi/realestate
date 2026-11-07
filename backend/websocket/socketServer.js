const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { tokenFromHandshake } = require('../utils/authCookie');
const User = require('../models/User');
const logger = require('../utils/logger');

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'] // Fallback support
    });

    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> user data mapping
    this.typingUsers = new Map(); // messageId -> Set of typing user IDs
    this.messageRooms = new Map(); // messageId -> Set of participant user IDs

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = tokenFromHandshake(socket.handshake);
        
        if (!token) {
          logger.debug('No token provided for WebSocket connection');
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('JWT decoded:', { userId: decoded.userId, exp: decoded.exp });
        
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          logger.debug('User not found for userId:', decoded.userId);
          return next(new Error('User not found'));
        }

        logger.debug('WebSocket authentication successful for user:', user.name, user.email);
        socket.userId = user._id.toString();
        socket.user = user;
        socket.displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.debug(`User ${socket.displayName} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, {
        userId: socket.userId,
        user: socket.user,
        socket: socket
      });

      // Join user to their personal room for notifications
      socket.join(`user_${socket.userId}`);

      // Emit user online status to relevant contacts
      this.emitUserOnlineStatus(socket.userId, true);

      // Handle joining message thread rooms
      socket.on('join_message_thread', (messageId) => {
        this.joinMessageThread(socket, messageId);
      });

      // Handle leaving message thread rooms
      socket.on('leave_message_thread', (messageId) => {
        this.leaveMessageThread(socket, messageId);
      });

      // Handle sending messages
      socket.on('send_message', (data) => {
        this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle read receipts
      socket.on('mark_message_read', (data) => {
        this.handleMarkMessageRead(socket, data);
      });

      // Handle user status updates
      socket.on('update_status', (status) => {
        this.handleStatusUpdate(socket, status);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  joinMessageThread(socket, messageId) {
    if (!messageId) return;

    socket.join(`message_${messageId}`);
    
    // Store room participants
    if (!this.messageRooms.has(messageId)) {
      this.messageRooms.set(messageId, new Set());
    }
    this.messageRooms.get(messageId).add(socket.userId);

    logger.debug(`User ${socket.displayName} joined message thread ${messageId}`);
  }

  leaveMessageThread(socket, messageId) {
    if (!messageId) return;

    socket.leave(`message_${messageId}`);
    
    if (this.messageRooms.has(messageId)) {
      this.messageRooms.get(messageId).delete(socket.userId);
      if (this.messageRooms.get(messageId).size === 0) {
        this.messageRooms.delete(messageId);
      }
    }

    logger.debug(`User ${socket.displayName} left message thread ${messageId}`);
  }

  async handleSendMessage(socket, data) {
    try {
      const { messageId, message, messageType = 'text' } = data;

      if (!messageId || !message) {
        socket.emit('error', { message: 'Message ID and content are required' });
        return;
      }

      // Emit message to all participants in the message thread
      this.io.to(`message_${messageId}`).emit('new_message', {
        messageId,
        message,
        messageType,
        sender: {
          id: socket.userId,
          name: socket.displayName,
          email: socket.user.email
        },
        timestamp: new Date(),
        isFromCurrentUser: false // Will be true for the sender
      });

      // Send confirmation to sender
      socket.emit('message_sent', {
        messageId,
        message,
        messageType,
        timestamp: new Date()
      });

      logger.debug(`Message sent in thread ${messageId} by ${socket.displayName}`);

    } catch (error) {
      logger.error('Error handling send message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(socket, data) {
    const { messageId } = data;
    if (!messageId) return;

    if (!this.typingUsers.has(messageId)) {
      this.typingUsers.set(messageId, new Set());
    }
    
    this.typingUsers.get(messageId).add(socket.userId);

    // Emit typing indicator to other participants
    socket.to(`message_${messageId}`).emit('user_typing', {
      messageId,
      userId: socket.userId,
      userName: socket.displayName,
      isTyping: true
    });
  }

  handleTypingStop(socket, data) {
    const { messageId } = data;
    if (!messageId) return;

    if (this.typingUsers.has(messageId)) {
      this.typingUsers.get(messageId).delete(socket.userId);
      
      if (this.typingUsers.get(messageId).size === 0) {
        this.typingUsers.delete(messageId);
      }
    }

    // Emit typing stop to other participants
    socket.to(`message_${messageId}`).emit('user_typing', {
      messageId,
      userId: socket.userId,
      userName: socket.displayName,
      isTyping: false
    });
  }

  async handleMarkMessageRead(socket, data) {
    try {
      const { messageId, threadMessageId } = data;

      if (!messageId) return;

      // Emit read receipt to other participants
      socket.to(`message_${messageId}`).emit('message_read', {
        messageId,
        threadMessageId,
        readBy: {
          id: socket.userId,
          name: socket.displayName
        },
        readAt: new Date()
      });

      logger.debug(`Message ${messageId} marked as read by ${socket.displayName}`);

    } catch (error) {
      logger.error('Error handling mark message read:', error);
    }
  }

  handleStatusUpdate(socket, status) {
    // Emit status update to user's personal room
    socket.to(`user_${socket.userId}`).emit('user_status_update', {
      userId: socket.userId,
      status,
      timestamp: new Date()
    });
  }

  handleDisconnect(socket) {
    logger.debug(`User ${socket.user?.name || 'Unknown'} disconnected`);

    // Remove from connected users
    this.connectedUsers.delete(socket.userId);
    this.userSockets.delete(socket.id);

    // Emit user offline status
    this.emitUserOnlineStatus(socket.userId, false);

    // Clean up typing indicators
    for (const [messageId, typingSet] of this.typingUsers.entries()) {
      typingSet.delete(socket.userId);
      if (typingSet.size === 0) {
        this.typingUsers.delete(messageId);
      }
    }

    // Clean up message rooms
    for (const [messageId, participantSet] of this.messageRooms.entries()) {
      participantSet.delete(socket.userId);
      if (participantSet.size === 0) {
        this.messageRooms.delete(messageId);
      }
    }
  }

  emitUserOnlineStatus(userId, isOnline) {
    // Emit to all connected users (you might want to limit this to contacts)
    this.io.emit('user_status_change', {
      userId,
      isOnline,
      timestamp: new Date()
    });
  }

  // Method to emit new message from API (called from message controller)
  emitNewMessage(messageData) {
    const { messageId, buyer, seller, renter, landlord, message, sender } = messageData;
    
    // Handle sales messages (buyer-seller)
    if (buyer && seller) {
      this.io.to(`user_${buyer}`).emit('new_message_notification', {
        messageId,
        message,
        sender,
        timestamp: new Date()
      });
      
      this.io.to(`user_${seller}`).emit('new_message_notification', {
        messageId,
        message,
        sender,
        timestamp: new Date()
      });
    }
    
    // Handle rental messages (renter-landlord)
    if (renter && landlord) {
      this.io.to(`user_${renter}`).emit('new_message_notification', {
        messageId,
        message,
        sender,
        timestamp: new Date()
      });
      
      this.io.to(`user_${landlord}`).emit('new_message_notification', {
        messageId,
        message,
        sender,
        timestamp: new Date()
      });
    }

    // Also emit to message thread room if participants are connected
    this.io.to(`message_${messageId}`).emit('new_message', {
      messageId,
      message,
      sender,
      timestamp: new Date(),
      isFromCurrentUser: false
    });
  }

  // Method to emit message read status
  emitMessageRead(messageId, readBy) {
    this.io.to(`message_${messageId}`).emit('message_read', {
      messageId,
      readBy,
      readAt: new Date()
    });
  }

  // Method to emit typing indicator
  emitTypingIndicator(messageId, userId, userName, isTyping) {
    this.io.to(`message_${messageId}`).emit('user_typing', {
      messageId,
      userId,
      userName,
      isTyping
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get user's socket if connected
  getUserSocket(userId) {
    const socketId = this.connectedUsers.get(userId);
    return socketId ? this.userSockets.get(socketId) : null;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketServer;
