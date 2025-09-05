# WebSocket Implementation for Real-Time Messaging

This document outlines the complete WebSocket implementation for real-time messaging in the Real Estate application.

## Overview

The WebSocket implementation provides:
- **Real-time message delivery** - Instant message sending and receiving
- **Typing indicators** - See when someone is typing
- **Read receipts** - Know when messages have been read
- **Online status** - See who's online/offline
- **Live notifications** - Real-time notifications for new messages
- **Connection management** - Automatic reconnection and fallback support

## Architecture

### Backend Components

#### 1. WebSocket Server (`backend/websocket/socketServer.js`)
- **Socket.IO server** with authentication middleware
- **Room management** for message threads
- **Event handling** for all real-time features
- **User connection tracking** and status management

#### 2. Message Controller Integration
- **WebSocket events** emitted when messages are sent/received
- **Read receipt handling** via WebSocket
- **Real-time notifications** for new messages

#### 3. Server Integration (`backend/server.js`)
- **HTTP server** upgraded to support WebSocket
- **Global socket server** instance for controller access
- **CORS configuration** for WebSocket connections

### Frontend Components

#### 1. WebSocket Service (`frontend/src/services/websocketService.js`)
- **Singleton service** for WebSocket management
- **Event listener management** with cleanup
- **Connection state handling** and reconnection logic
- **Message thread room management**

#### 2. React Hook (`frontend/src/hooks/useWebSocket.js`)
- **Custom hook** for WebSocket integration
- **Automatic connection** based on authentication
- **Event listener management** with React lifecycle
- **Connection status** and error handling

#### 3. UI Components
- **RealTimeMessaging** - Main messaging interface
- **TypingIndicator** - Shows when users are typing
- **OnlineStatus** - Displays user online/offline status
- **RealTimeNotificationCenter** - Real-time notifications
- **MessageThread** - Complete message thread with WebSocket integration

## Features

### 1. Real-Time Messaging
```javascript
// Send message via WebSocket
sendMessage(messageId, message, messageType);

// Receive messages in real-time
addEventListener('new_message', (data) => {
  // Handle new message
});
```

### 2. Typing Indicators
```javascript
// Start typing indicator
startTyping(messageId);

// Stop typing indicator
stopTyping(messageId);

// Listen for typing events
addEventListener('user_typing', (data) => {
  // Handle typing indicator
});
```

### 3. Read Receipts
```javascript
// Mark message as read
markMessageRead(messageId, threadMessageId);

// Listen for read receipts
addEventListener('message_read', (data) => {
  // Handle read receipt
});
```

### 4. Online Status
```javascript
// Update user status
updateStatus('online' | 'away' | 'busy' | 'offline');

// Listen for status changes
addEventListener('user_status_change', (data) => {
  // Handle status change
});
```

### 5. Notifications
```javascript
// Listen for new message notifications
addEventListener('new_message_notification', (data) => {
  // Handle notification
});
```

## Setup Instructions

### Backend Setup

1. **Install Dependencies** (already included in package.json):
```bash
npm install socket.io
```

2. **Environment Variables**:
```env
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000,http://localhost:3001
```

3. **Start Server**:
```bash
npm run dev
```

### Frontend Setup

1. **Install Dependencies**:
```bash
npm install socket.io-client
```

2. **Environment Variables**:
```env
REACT_APP_API_URL=http://localhost:5000
```

3. **Integration**:
```javascript
// In your main App component
import useWebSocket from './hooks/useWebSocket';

function App() {
  const { isConnected } = useWebSocket();
  
  return (
    <div>
      {!isConnected && <div>Connecting to real-time messaging...</div>}
      {/* Your app content */}
    </div>
  );
}
```

## Usage Examples

### Basic Message Thread
```javascript
import React from 'react';
import MessageThread from './components/MessageThread';

function MessagesPage() {
  return (
    <div>
      <MessageThread messageId="message_id_here" />
    </div>
  );
}
```

### Custom WebSocket Integration
```javascript
import React, { useEffect } from 'react';
import useWebSocket from './hooks/useWebSocket';

function CustomComponent() {
  const { 
    isConnected, 
    sendMessage, 
    addEventListener 
  } = useWebSocket();

  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('New message:', data);
    };

    addEventListener('new_message', handleNewMessage);
    
    return () => {
      removeEventListener('new_message', handleNewMessage);
    };
  }, [addEventListener, removeEventListener]);

  const handleSend = () => {
    sendMessage('message_id', 'Hello World!');
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSend}>Send Message</button>
    </div>
  );
}
```

### Notification Center
```javascript
import React from 'react';
import RealTimeNotificationCenter from './components/RealTimeNotificationCenter';

function Header() {
  return (
    <header>
      <h1>Real Estate App</h1>
      <RealTimeNotificationCenter />
    </header>
  );
}
```

## WebSocket Events

### Client to Server Events
- `join_message_thread` - Join a message thread room
- `leave_message_thread` - Leave a message thread room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_message_read` - Mark message as read
- `update_status` - Update user status

### Server to Client Events
- `new_message` - New message received
- `new_message_notification` - New message notification
- `message_sent` - Message sent confirmation
- `message_read` - Message read receipt
- `user_typing` - User typing indicator
- `user_status_change` - User online/offline status
- `user_status_update` - User status update
- `connection_status` - Connection status change
- `error` - WebSocket error

## Error Handling

### Connection Errors
- **Automatic reconnection** with exponential backoff
- **Fallback to polling** if WebSocket fails
- **User notification** of connection status

### Message Errors
- **Retry logic** for failed message sends
- **Offline queuing** for messages when disconnected
- **Error notifications** for failed operations

## Performance Considerations

### Backend
- **Room-based messaging** reduces unnecessary broadcasts
- **Connection pooling** for efficient resource usage
- **Event throttling** for typing indicators

### Frontend
- **Event listener cleanup** prevents memory leaks
- **Message batching** for high-frequency updates
- **Connection state management** for optimal UX

## Security

### Authentication
- **JWT token validation** for WebSocket connections
- **User verification** before joining rooms
- **Message authorization** checks

### Data Validation
- **Input sanitization** for all WebSocket events
- **Rate limiting** for message sending
- **Message size limits** to prevent abuse

## Testing

### Backend Testing
```javascript
// Test WebSocket connection
const io = require('socket.io-client');
const socket = io('http://localhost:5000', {
  auth: { token: 'valid_jwt_token' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### Frontend Testing
```javascript
// Test WebSocket service
import websocketService from './services/websocketService';

websocketService.connect('valid_token');
websocketService.on('connection_status', (data) => {
  console.log('Connection status:', data);
});
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check CORS configuration
   - Verify JWT token validity
   - Ensure server is running

2. **Messages Not Received**
   - Verify room joining
   - Check event listener setup
   - Confirm message authorization

3. **Typing Indicators Not Working**
   - Check typing timeout settings
   - Verify event listener cleanup
   - Confirm room membership

### Debug Mode
```javascript
// Enable WebSocket debugging
localStorage.setItem('debug', 'socket.io-client:*');
```

## Future Enhancements

- **Message encryption** for sensitive conversations
- **File sharing** via WebSocket
- **Voice/video calling** integration
- **Message reactions** and emoji support
- **Message search** with real-time updates
- **Push notifications** for mobile devices

## Conclusion

This WebSocket implementation provides a robust, scalable solution for real-time messaging in the Real Estate application. It follows best practices for security, performance, and user experience while maintaining clean separation of concerns between backend and frontend components.

The implementation is designed to be easily extensible and maintainable, with comprehensive error handling and fallback mechanisms to ensure a smooth user experience even in challenging network conditions.
