import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useWebSocket from '../hooks/useWebSocket';
import './OnlineStatus.css';

const OnlineStatus = ({ userId, showName = false, size = 'small' }) => {
  const { user } = useSelector((state) => state.auth);
  const { isConnected, addEventListener, removeEventListener } = useWebSocket();
  
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [status, setStatus] = useState('offline');

  // Handle user status changes
  const handleUserStatusChange = useCallback((data) => {
    if (data.userId === userId) {
      setIsOnline(data.isOnline);
      setLastSeen(data.timestamp);
    }
  }, [userId]);

  // Handle user status updates
  const handleUserStatusUpdate = useCallback((data) => {
    if (data.userId === userId) {
      setStatus(data.status);
    }
  }, [userId]);

  // Set up WebSocket event listeners
  useEffect(() => {
    addEventListener('user_status_change', handleUserStatusChange);
    addEventListener('user_status_update', handleUserStatusUpdate);

    return () => {
      removeEventListener('user_status_change', handleUserStatusChange);
      removeEventListener('user_status_update', handleUserStatusUpdate);
    };
  }, [addEventListener, removeEventListener, handleUserStatusChange, handleUserStatusUpdate]);

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diff = now - lastSeenDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = () => {
    if (!isOnline) return '#dc3545'; // Red for offline
    if (status === 'away') return '#ffc107'; // Yellow for away
    if (status === 'busy') return '#6c757d'; // Gray for busy
    return '#28a745'; // Green for online
  };

  // Get status text
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (status === 'away') return 'Away';
    if (status === 'busy') return 'Busy';
    return 'Online';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    if (status === 'away') return '🟡';
    if (status === 'busy') return '⚫';
    return '🟢';
  };

  return (
    <div className={`online-status ${size}`}>
      <div className="status-indicator">
        <div 
          className="status-dot"
          style={{ backgroundColor: getStatusColor() }}
        />
        {size === 'large' && (
          <div className="status-icon">
            {getStatusIcon()}
          </div>
        )}
      </div>
      
      {showName && (
        <div className="status-info">
          <div className="status-text">
            {getStatusText()}
          </div>
          {!isOnline && lastSeen && (
            <div className="last-seen">
              Last seen {formatLastSeen(lastSeen)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineStatus;
