import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useWebSocket from '../hooks/useWebSocket';
import RealTimeMessaging from './RealTimeMessaging';
import RealTimeNotificationCenter from './RealTimeNotificationCenter';
import OnlineStatus from './OnlineStatus';
import './WebSocketIntegrationExample.css';

const WebSocketIntegrationExample = () => {
  const { user } = useSelector((state) => state.auth);
  const {
    isConnected,
    connectionError,
    joinMessageThread,
    leaveMessageThread,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    addEventListener,
    removeEventListener
  } = useWebSocket();

  const [messageId, setMessageId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  // WebSocket event handlers
  useEffect(() => {
    const handleNewMessage = (data) => {
      addLog(`New message received: ${data.message}`, 'success');
    };

    const handleUserTyping = (data) => {
      addLog(`${data.userName} is ${data.isTyping ? 'typing' : 'not typing'}`, 'info');
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

    const handleMessageRead = (data) => {
      addLog(`Message read by ${data.readBy.name}`, 'success');
    };

    const handleConnectionStatus = (data) => {
      addLog(`Connection status: ${data.connected ? 'Connected' : 'Disconnected'}`, data.connected ? 'success' : 'error');
    };

    const handleError = (error) => {
      addLog(`WebSocket error: ${error.message}`, 'error');
    };

    // Add event listeners
    addEventListener('new_message', handleNewMessage);
    addEventListener('user_typing', handleUserTyping);
    addEventListener('message_read', handleMessageRead);
    addEventListener('connection_status', handleConnectionStatus);
    addEventListener('error', handleError);

    return () => {
      removeEventListener('new_message', handleNewMessage);
      removeEventListener('user_typing', handleUserTyping);
      removeEventListener('message_read', handleMessageRead);
      removeEventListener('connection_status', handleConnectionStatus);
      removeEventListener('error', handleError);
    };
  }, [addEventListener, removeEventListener]);

  // Handle joining message thread
  const handleJoinThread = () => {
    if (messageId.trim()) {
      joinMessageThread(messageId.trim());
      addLog(`Joined message thread: ${messageId}`, 'info');
    }
  };

  // Handle leaving message thread
  const handleLeaveThread = () => {
    if (messageId.trim()) {
      leaveMessageThread(messageId.trim());
      addLog(`Left message thread: ${messageId}`, 'info');
    }
  };

  // Handle sending test message
  const handleSendTestMessage = () => {
    if (messageId.trim() && testMessage.trim()) {
      sendMessage(messageId.trim(), testMessage.trim());
      addLog(`Sent test message: ${testMessage}`, 'info');
      setTestMessage('');
    }
  };

  // Handle typing test
  const handleStartTyping = () => {
    if (messageId.trim()) {
      startTyping(messageId.trim());
      addLog('Started typing indicator', 'info');
    }
  };

  const handleStopTyping = () => {
    if (messageId.trim()) {
      stopTyping(messageId.trim());
      addLog('Stopped typing indicator', 'info');
    }
  };

  // Handle mark as read
  const handleMarkAsRead = () => {
    if (messageId.trim()) {
      markMessageRead(messageId.trim());
      addLog('Marked message as read', 'info');
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="websocket-integration-example">
      <div className="header">
        <h2>WebSocket Integration Example</h2>
        <div className="status-indicators">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {connectionError && (
            <div className="connection-error">
              Error: {connectionError}
            </div>
          )}
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="messageId">Message Thread ID:</label>
          <input
            id="messageId"
            type="text"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="Enter message thread ID"
          />
          <div className="button-group">
            <button onClick={handleJoinThread} disabled={!messageId.trim()}>
              Join Thread
            </button>
            <button onClick={handleLeaveThread} disabled={!messageId.trim()}>
              Leave Thread
            </button>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="testMessage">Test Message:</label>
          <div className="message-input-group">
            <input
              id="testMessage"
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message"
              onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
            />
            <button onClick={handleSendTestMessage} disabled={!messageId.trim() || !testMessage.trim()}>
              Send
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Typing Indicators:</label>
          <div className="button-group">
            <button onClick={handleStartTyping} disabled={!messageId.trim()}>
              Start Typing
            </button>
            <button onClick={handleStopTyping} disabled={!messageId.trim()}>
              Stop Typing
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Message Actions:</label>
          <div className="button-group">
            <button onClick={handleMarkAsRead} disabled={!messageId.trim()}>
              Mark as Read
            </button>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="left-panel">
          <h3>Real-Time Messaging</h3>
          <RealTimeMessaging
            messageId={messageId}
            onMessageReceived={(data) => addLog(`Message received: ${data.message}`, 'success')}
            onTypingUpdate={(data) => addLog(`Typing update: ${data.userName}`, 'info')}
          />
        </div>

        <div className="right-panel">
          <div className="panel-section">
            <h3>Notifications</h3>
            <RealTimeNotificationCenter />
          </div>

          <div className="panel-section">
            <h3>Online Status</h3>
            <div className="online-status-demo">
              <OnlineStatus userId={user?.id} showName={true} size="large" />
            </div>
          </div>

          <div className="panel-section">
            <h3>Typing Users</h3>
            <div className="typing-users">
              {typingUsers.length === 0 ? (
                <p>No one is typing</p>
              ) : (
                typingUsers.map(user => (
                  <div key={user.userId} className="typing-user">
                    {user.userName} is typing...
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="logs-section">
        <div className="logs-header">
          <h3>Event Logs</h3>
          <button onClick={clearLogs} className="clear-logs">
            Clear Logs
          </button>
        </div>
        <div className="logs">
          {logs.length === 0 ? (
            <p>No events yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketIntegrationExample;
