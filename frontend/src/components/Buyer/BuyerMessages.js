import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getMessages, 
  getMessageThread, 
  replyToMessage, 
  markAsRead,
  getUnreadCount,
  sendMessage
} from '../../store/slices/messageSlice';
import { 
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PaperAirplaneIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const BuyerMessages = () => {
  const dispatch = useDispatch();
  const { 
    messages = [], 
    currentThread, 
    unreadCount = 0,
    loading = false, 
    error = null
  } = useSelector(state => state.messages || {});
  const { user = null } = useSelector(state => state.auth || {});
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    role: 'buyer' // Default to buyer view
  });
  const hasInitialized = useRef(false);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [filters.status, filters.role]);

  // Memoize filter change handler
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  // Load messages on component mount (with StrictMode guard)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const abortController = new AbortController();
    let mounted = true;

    const loadMessages = async () => {
      try {
        if (!mounted) return;
        await dispatch(getMessages({ role: 'buyer' }));
        if (!mounted) return;
        await dispatch(getUnreadCount());
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to load messages:', error);
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [dispatch]);

  // Load messages when filters change
  useEffect(() => {
    if (hasInitialized.current) {
      dispatch(getMessages({ role: 'buyer', ...memoizedFilters }));
    }
  }, [dispatch, memoizedFilters]);

  // Auto-refresh unread count every 10 seconds (throttled)
  useEffect(() => {
    let alive = true;
    const interval = setInterval(() => {
      if (!alive) return;
      dispatch(getUnreadCount());
    }, 10000); // 10 seconds instead of 30

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [dispatch]);

  const handleMessageSelect = async (message) => {
    setSelectedMessage(message);
    setReplyText('');
    
    // Load the full message thread
    dispatch(getMessageThread(message._id));
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    if (!selectedMessage) {
      toast.error('No message selected');
      return;
    }

    try {
      const result = await dispatch(replyToMessage({
        messageId: selectedMessage._id,
        message: replyText.trim()
      }));

      if (replyToMessage.fulfilled.match(result)) {
        toast.success('Reply sent successfully!');
        setReplyText('');
        // Refresh the message list
        dispatch(getMessages({ role: 'buyer', ...memoizedFilters }));
        dispatch(getUnreadCount());
      } else {
        toast.error(result.payload || 'Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleSendNewMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // This would need to be implemented in the backend
    // For now, we'll show a placeholder
    toast.info('New message feature coming soon!');
    setNewMessageText('');
    setShowNewMessageModal(false);
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await dispatch(markAsRead(messageId));
      dispatch(getUnreadCount());
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'replied': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && (!messages || messages.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Message
          </button>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
          
          {!messages || messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No messages yet</p>
              <p className="text-sm">Start a conversation with a seller about a property</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message._id}
                  onClick={() => handleMessageSelect(message)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMessage?._id === message._id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!message.readBy?.buyer ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{message.subject}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                        {!message.readBy?.buyer && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        To: {message.seller?.name || 'Unknown Seller'}
                      </p>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        Property: {message.property?.title || 'Unknown Property'}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(message.lastMessageAt)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1">
                      {!message.readBy?.buyer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(message._id);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Mark as read"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
          
          {!selectedMessage ? (
            <div className="text-center py-8 text-gray-500">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">Select a conversation to view messages</p>
            </div>
          ) : (
            <div className="border rounded-lg h-96 flex flex-col">
              {/* Message Header */}
              <div className="p-4 border-b bg-gray-50">
                <h4 className="font-medium text-gray-900">{selectedMessage.subject}</h4>
                <p className="text-sm text-gray-600">
                  Property: {selectedMessage.property?.title || 'Unknown Property'}
                </p>
                <p className="text-sm text-gray-600">
                  Seller: {selectedMessage.seller?.name || 'Unknown'} ({selectedMessage.seller?.email || 'No email'})
                </p>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentThread?.thread && currentThread.thread.length > 0 ? currentThread.thread.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender?._id === user?._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender?._id === user?._id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        {formatDate(msg.sentAt)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No messages in this conversation yet.</p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {selectedMessage.status !== 'closed' && (
                <div className="p-4 border-t">
                  <form onSubmit={handleReply}>
                    <div className="flex space-x-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={loading || !replyText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Send New Message</h3>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSendNewMessage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Message subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerMessages;
