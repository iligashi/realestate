import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';

const useWebSocket = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const listenersRef = useRef(new Map());

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    console.log('WebSocket hook effect triggered:', { hasToken: !!token, hasUser: !!user, tokenPreview: token ? token.substring(0, 20) + '...' : 'none' });
    if (token && user) {
      console.log('Connecting to WebSocket with token');
      websocketService.connect(token);
    } else {
      console.log('Disconnecting WebSocket - no token or user');
      websocketService.disconnect();
      setIsConnected(false);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [token, user]);

  // Listen for connection status changes
  useEffect(() => {
    const handleConnectionStatus = (data) => {
      setIsConnected(data.connected);
      if (!data.connected) {
        setConnectionError(data.reason || 'Connection lost');
      } else {
        setConnectionError(null);
      }
    };

    const handleConnectionError = (error) => {
      setConnectionError(error.message || 'Connection error');
    };

    websocketService.on('connection_status', handleConnectionStatus);
    websocketService.on('connection_error', handleConnectionError);

    return () => {
      websocketService.off('connection_status', handleConnectionStatus);
      websocketService.off('connection_error', handleConnectionError);
    };
  }, []);

  // Message thread management
  const joinMessageThread = useCallback((messageId) => {
    if (isConnected) {
      websocketService.joinMessageThread(messageId);
    }
  }, [isConnected]);

  const leaveMessageThread = useCallback((messageId) => {
    websocketService.leaveMessageThread(messageId);
  }, []);

  // Message sending
  const sendMessage = useCallback((messageId, message, messageType = 'text') => {
    if (isConnected) {
      websocketService.sendMessage(messageId, message, messageType);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [isConnected]);

  // Typing indicators
  const startTyping = useCallback((messageId) => {
    if (isConnected) {
      websocketService.startTyping(messageId);
    }
  }, [isConnected]);

  const stopTyping = useCallback((messageId) => {
    if (isConnected) {
      websocketService.stopTyping(messageId);
    }
  }, [isConnected]);

  // Read receipts
  const markMessageRead = useCallback((messageId, threadMessageId = null) => {
    if (isConnected) {
      websocketService.markMessageRead(messageId, threadMessageId);
    }
  }, [isConnected]);

  // Status updates
  const updateStatus = useCallback((status) => {
    if (isConnected) {
      websocketService.updateStatus(status);
    }
  }, [isConnected]);

  // Event listener management
  const addEventListener = useCallback((event, callback) => {
    websocketService.on(event, callback);
    
    // Store reference for cleanup
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, []);
    }
    listenersRef.current.get(event).push(callback);
  }, []);

  const removeEventListener = useCallback((event, callback) => {
    websocketService.off(event, callback);
    
    if (listenersRef.current.has(event)) {
      const callbacks = listenersRef.current.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }, []);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          websocketService.off(event, callback);
        });
      });
      listenersRef.current.clear();
    };
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (token) {
      websocketService.reconnectWithToken(token);
    }
  }, [token]);

  return {
    isConnected,
    connectionError,
    joinMessageThread,
    leaveMessageThread,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    updateStatus,
    addEventListener,
    removeEventListener,
    reconnect
  };
};

export default useWebSocket;
