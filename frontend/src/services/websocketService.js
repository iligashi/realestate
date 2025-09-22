import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.currentMessageThread = null;
  }

  connect(token) {
    console.log('WebSocketService.connect called with token:', !!token);
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    console.log('Connecting to WebSocket with token:', {
      serverUrl,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Add connection event listeners for debugging
    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection_error', error);
    });

    // Message events
    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      this.emit('new_message', data);
    });

    this.socket.on('new_message_notification', (data) => {
      console.log('New message notification:', data);
      this.emit('new_message_notification', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', data);
      this.emit('message_sent', data);
    });

    this.socket.on('message_read', (data) => {
      console.log('Message read receipt:', data);
      this.emit('message_read', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data);
      this.emit('user_typing', data);
    });

    // User status events
    this.socket.on('user_status_change', (data) => {
      console.log('User status change:', data);
      this.emit('user_status_change', data);
    });

    this.socket.on('user_status_update', (data) => {
      console.log('User status update:', data);
      this.emit('user_status_update', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Message thread management
  joinMessageThread(messageId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join message thread: WebSocket not connected');
      return;
    }

    this.currentMessageThread = messageId;
    this.socket.emit('join_message_thread', messageId);
    console.log(`Joined message thread: ${messageId}`);
  }

  leaveMessageThread(messageId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave_message_thread', messageId);
    if (this.currentMessageThread === messageId) {
      this.currentMessageThread = null;
    }
    console.log(`Left message thread: ${messageId}`);
  }

  // Send message
  sendMessage(messageId, message, messageType = 'text') {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    this.socket.emit('send_message', {
      messageId,
      message,
      messageType
    });
  }

  // Typing indicators
  startTyping(messageId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_start', { messageId });
  }

  stopTyping(messageId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_stop', { messageId });
  }

  // Read receipts
  markMessageRead(messageId, threadMessageId = null) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('mark_message_read', {
      messageId,
      threadMessageId
    });
  }

  // Status updates
  updateStatus(status) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('update_status', status);
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${event}:`, error);
      }
    });
  }

  // Utility methods
  isConnectedToServer() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getCurrentMessageThread() {
    return this.currentMessageThread;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentMessageThread = null;
      this.listeners.clear();
    }
  }

  // Reconnect with new token
  reconnectWithToken(token) {
    this.disconnect();
    this.connect(token);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
