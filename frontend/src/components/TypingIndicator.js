import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useWebSocket from '../hooks/useWebSocket';
import './TypingIndicator.css';

const TypingIndicator = ({ messageId, onTypingChange }) => {
  const { user } = useSelector((state) => state.auth);
  const { isConnected, addEventListener, removeEventListener } = useWebSocket();
  
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Handle typing events from WebSocket
  const handleUserTyping = useCallback((data) => {
    if (data.messageId !== messageId) return;
    
    // Don't show typing indicator for current user
    if (data.userId === user?.id) return;

    setTypingUsers(prev => {
      if (data.isTyping) {
        // Add or update user
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, {
          userId: data.userId,
          userName: data.userName,
          timestamp: Date.now()
        }];
      } else {
        // Remove user
        return prev.filter(u => u.userId !== data.userId);
      }
    });

    // Notify parent component
    if (onTypingChange) {
      onTypingChange(data);
    }
  }, [messageId, user, onTypingChange]);

  // Set up WebSocket event listeners
  useEffect(() => {
    addEventListener('user_typing', handleUserTyping);

    return () => {
      removeEventListener('user_typing', handleUserTyping);
    };
  }, [addEventListener, removeEventListener, handleUserTyping]);

  // Clean up expired typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 10000) // 10 seconds timeout
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  return renderTypingIndicator();
};

export default TypingIndicator;
