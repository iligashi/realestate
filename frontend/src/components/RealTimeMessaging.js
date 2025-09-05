import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useWebSocket from '../hooks/useWebSocket';
import { sendMessage as sendMessageAPI, replyToMessage } from '../services/messageAPI';
import './RealTimeMessaging.css';

const RealTimeMessaging = ({ messageId, onMessageReceived, onTypingUpdate }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const {
    isConnected,
    joinMessageThread,
    leaveMessageThread,
    sendMessage: sendWebSocketMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    addEventListener,
    removeEventListener
  } = useWebSocket();

  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [readReceipts, setReadReceipts] = useState(new Map());
  
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Join message thread when component mounts
  useEffect(() => {
    if (messageId && isConnected) {
      joinMessageThread(messageId);
    }

    return () => {
      if (messageId) {
        leaveMessageThread(messageId);
      }
    };
  }, [messageId, isConnected, joinMessageThread, leaveMessageThread]);

  // Set up WebSocket event listeners
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('Real-time message received:', data);
      
      // Add message to local state
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(), // Temporary ID for UI
        content: data.message,
        sender: data.sender,
        timestamp: data.timestamp,
        isFromCurrentUser: data.sender.id === user?.id
      }]);

      // Notify parent component
      if (onMessageReceived) {
        onMessageReceived(data);
      }

      // Mark as read if it's not from current user
      if (data.sender.id !== user?.id) {
        markMessageRead(messageId);
      }
    };

    const handleMessageSent = (data) => {
      console.log('Message sent confirmation:', data);
      setIsSending(false);
    };

    const handleUserTyping = (data) => {
      console.log('User typing:', data);
      
      if (data.userId !== user?.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...prev.filter(u => u.userId !== data.userId), {
              userId: data.userId,
              userName: data.userName
            }];
          } else {
            return prev.filter(u => u.userId !== data.userId);
          }
        });

        // Notify parent component
        if (onTypingUpdate) {
          onTypingUpdate(data);
        }
      }
    };

    const handleMessageRead = (data) => {
      console.log('Message read receipt:', data);
      setReadReceipts(prev => new Map(prev.set(data.threadMessageId || data.messageId, {
        readBy: data.readBy,
        readAt: data.readAt
      })));
    };

    const handleError = (error) => {
      console.error('WebSocket error in messaging:', error);
      setIsSending(false);
    };

    // Add event listeners
    addEventListener('new_message', handleNewMessage);
    addEventListener('message_sent', handleMessageSent);
    addEventListener('user_typing', handleUserTyping);
    addEventListener('message_read', handleMessageRead);
    addEventListener('error', handleError);

    // Cleanup
    return () => {
      removeEventListener('new_message', handleNewMessage);
      removeEventListener('message_sent', handleMessageSent);
      removeEventListener('user_typing', handleUserTyping);
      removeEventListener('message_read', handleMessageRead);
      removeEventListener('error', handleError);
    };
  }, [messageId, user, addEventListener, removeEventListener, markMessageRead, onMessageReceived, onTypingUpdate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = useCallback((e) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(messageId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(messageId);
      }
    }, 1000);
  }, [messageId, isTyping, startTyping, stopTyping]);

  // Handle message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || !isConnected) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);

    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping(messageId);
    }

    try {
      // Send via WebSocket for real-time delivery
      sendWebSocketMessage(messageId, messageContent);

      // Also send via API to persist the message
      await replyToMessage(messageId, { message: messageContent });

    } catch (error) {
      console.error('Error sending message:', error);
      setIsSending(false);
      // You might want to show an error message to the user
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="typing-indicator">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="typing-text">
          {typingUsers.length === 1 
            ? `${typingUsers[0].userName} is typing...`
            : `${typingUsers.length} people are typing...`
          }
        </span>
      </div>
    );
  };

  // Render read receipt
  const renderReadReceipt = (messageId) => {
    const receipt = readReceipts.get(messageId);
    if (!receipt) return null;

    return (
      <div className="read-receipt">
        <span className="read-by">Read by {receipt.readBy.name}</span>
        <span className="read-time">{formatTime(receipt.readAt)}</span>
      </div>
    );
  };

  return (
    <div className="real-time-messaging">
      {/* Connection Status */}
      {!isConnected && (
        <div className="connection-status error">
          <span>⚠️ Disconnected from real-time messaging</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message ${msg.isFromCurrentUser ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              <div className="message-meta">
                <span className="message-time">{formatTime(msg.timestamp)}</span>
                {msg.isFromCurrentUser && renderReadReceipt(msg.id)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {renderTypingIndicator()}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected || isSending}
            className="message-input"
            rows="1"
          />
          <button 
            type="submit" 
            disabled={!message.trim() || isSending || !isConnected}
            className="send-button"
          >
            {isSending ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealTimeMessaging;
