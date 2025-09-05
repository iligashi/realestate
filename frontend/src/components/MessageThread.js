import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import RealTimeMessaging from './RealTimeMessaging';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';
import RealTimeNotificationCenter from './RealTimeNotificationCenter';
import { getMessageThread, replyToMessage } from '../services/messageAPI';
import './MessageThread.css';

const MessageThread = () => {
  const { messageId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const {
    isConnected,
    joinMessageThread,
    leaveMessageThread,
    addEventListener,
    removeEventListener
  } = useWebSocket();

  const [messageThread, setMessageThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Load message thread data
  useEffect(() => {
    const loadMessageThread = async () => {
      try {
        setLoading(true);
        const response = await getMessageThread(messageId);
        setMessageThread(response.message);
        setError(null);
      } catch (err) {
        console.error('Error loading message thread:', err);
        setError('Failed to load message thread');
      } finally {
        setLoading(false);
      }
    };

    if (messageId) {
      loadMessageThread();
    }
  }, [messageId]);

  // Join message thread when connected
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

  // Handle typing indicators
  const handleTypingChange = (data) => {
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
  };

  // Handle new messages
  const handleNewMessage = (data) => {
    console.log('New message received in thread:', data);
    // The RealTimeMessaging component will handle updating the UI
  };

  // Set up WebSocket event listeners
  useEffect(() => {
    addEventListener('user_typing', handleTypingChange);
    addEventListener('new_message', handleNewMessage);

    return () => {
      removeEventListener('user_typing', handleTypingChange);
      removeEventListener('new_message', handleNewMessage);
    };
  }, [addEventListener, removeEventListener]);

  // Get the other participant
  const getOtherParticipant = () => {
    if (!messageThread) return null;
    
    if (messageThread.buyer._id === user?.id) {
      return messageThread.seller;
    } else {
      return messageThread.buyer;
    }
  };

  // Get property info
  const getPropertyInfo = () => {
    if (!messageThread) return null;
    return messageThread.property;
  };

  if (loading) {
    return (
      <div className="message-thread">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="message-thread">
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!messageThread) {
    return (
      <div className="message-thread">
        <div className="error">
          <p>Message thread not found</p>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const property = getPropertyInfo();

  return (
    <div className="message-thread">
      {/* Header */}
      <div className="message-header">
        <div className="participant-info">
          <div className="participant-avatar">
            <img 
              src={otherParticipant.profilePicture || '/default-avatar.png'} 
              alt={otherParticipant.name}
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <OnlineStatus 
              userId={otherParticipant._id} 
              size="small"
            />
          </div>
          <div className="participant-details">
            <h3>{otherParticipant.name}</h3>
            <p className="participant-email">{otherParticipant.email}</p>
          </div>
        </div>
        
        <div className="property-info">
          <h4>{property.title}</h4>
          <p className="property-price">${property.price.toLocaleString()}</p>
        </div>

        <div className="header-actions">
          <RealTimeNotificationCenter />
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="connection-warning">
          <span>⚠️ Real-time messaging disconnected. Messages will be sent when connection is restored.</span>
        </div>
      )}

      {/* Typing Indicator */}
      <TypingIndicator 
        messageId={messageId}
        onTypingChange={handleTypingChange}
      />

      {/* Messages */}
      <div className="messages-container">
        <RealTimeMessaging
          messageId={messageId}
          onMessageReceived={handleNewMessage}
          onTypingUpdate={handleTypingChange}
        />
      </div>

      {/* Property Details Sidebar */}
      <div className="property-sidebar">
        <div className="property-card">
          <img 
            src={property.images?.[0] || '/default-property.jpg'} 
            alt={property.title}
            className="property-image"
          />
          <div className="property-details">
            <h4>{property.title}</h4>
            <p className="property-location">
              {property.location?.city}, {property.location?.state}
            </p>
            <p className="property-price">${property.price.toLocaleString()}</p>
            <div className="property-specs">
              <span>{property.details?.bedrooms} bed</span>
              <span>{property.details?.bathrooms} bath</span>
              <span>{property.details?.squareMeters} sq ft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
