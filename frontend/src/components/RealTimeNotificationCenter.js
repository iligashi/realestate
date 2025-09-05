import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useWebSocket from '../hooks/useWebSocket';
import './RealTimeNotificationCenter.css';

const RealTimeNotificationCenter = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { isConnected, addEventListener, removeEventListener } = useWebSocket();

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle new message notifications
  const handleNewMessageNotification = useCallback((data) => {
    console.log('New message notification received:', data);
    
    const notification = {
      id: Date.now() + Math.random(),
      type: 'message',
      title: 'New Message',
      message: `New message from ${data.sender.name}`,
      data: data,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: 'message-notification'
      });
    }
  }, []);

  // Handle user status changes
  const handleUserStatusChange = useCallback((data) => {
    console.log('User status change:', data);
    
    // Only show status changes for contacts/friends
    // You might want to filter this based on your user relationships
    if (data.userId !== user?.id) {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'status',
        title: data.isOnline ? 'User Online' : 'User Offline',
        message: `User ${data.userId} is now ${data.isOnline ? 'online' : 'offline'}`,
        data: data,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
    }
  }, [user]);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((data) => {
    console.log('Connection status changed:', data);
    
    if (!data.connected) {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'system',
        title: 'Connection Lost',
        message: 'Real-time messaging disconnected. Attempting to reconnect...',
        data: data,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Set up WebSocket event listeners
  useEffect(() => {
    addEventListener('new_message_notification', handleNewMessageNotification);
    addEventListener('user_status_change', handleUserStatusChange);
    addEventListener('connection_status', handleConnectionStatus);

    return () => {
      removeEventListener('new_message_notification', handleNewMessageNotification);
      removeEventListener('user_status_change', handleUserStatusChange);
      removeEventListener('connection_status', handleConnectionStatus);
    };
  }, [addEventListener, removeEventListener, handleNewMessageNotification, handleUserStatusChange, handleConnectionStatus]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear notification
  const clearNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    // Handle different notification types
    switch (notification.type) {
      case 'message':
        // Navigate to message thread
        if (notification.data.messageId) {
          // You might want to use React Router here
          console.log('Navigate to message:', notification.data.messageId);
        }
        break;
      case 'status':
        // Handle status change
        console.log('User status change:', notification.data);
        break;
      default:
        break;
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'status':
        return '🟢';
      case 'system':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-center">
      {/* Notification Bell */}
      <div 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
        {!isConnected && (
          <span className="connection-indicator offline" title="Disconnected">⚠️</span>
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="header-actions">
              <button 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="mark-all-read"
              >
                Mark all read
              </button>
              <button 
                onClick={clearAllNotifications}
                className="clear-all"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  <div className="notification-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="clear-notification"
                      title="Clear notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <div className="connection-status">
              {isConnected ? (
                <span className="status-online">🟢 Connected</span>
              ) : (
                <span className="status-offline">🔴 Disconnected</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotificationCenter;
