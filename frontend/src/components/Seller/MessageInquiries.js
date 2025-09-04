import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getMessages, 
  getMessageThread, 
  replyToMessage, 
  markAsRead,
  getUnreadCount,
  closeMessage
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
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const MessageInquiries = () => {
  const dispatch = useDispatch();
  const { 
    messages = [], 
    currentThread, 
    unreadCount = 0,
    loading, 
    error 
  } = useSelector(state => state.messages);
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    role: 'seller' // Default to seller view
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
        await dispatch(getMessages({ role: 'seller' }));
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
      dispatch(getMessages({ role: 'seller', ...memoizedFilters }));
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
        dispatch(getMessages({ role: 'seller', ...memoizedFilters }));
        dispatch(getUnreadCount());
      } else {
        toast.error(result.payload || 'Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await dispatch(markAsRead(messageId));
      dispatch(getUnreadCount());
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleCloseMessage = async (messageId) => {
    try {
      const result = await dispatch(closeMessage(messageId));
      if (closeMessage.fulfilled.match(result)) {
        toast.success('Message thread closed');
        dispatch(getMessages({ role: 'seller', ...memoizedFilters }));
      }
    } catch (error) {
      toast.error('Failed to close message');
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
          <h2 className="text-2xl font-bold text-gray-900">Message Inquiries</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-2">
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
          <h3 className="text-lg font-semibold text-gray-900">Incoming Messages</h3>
          
          {!messages || messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No messages yet</p>
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
                                     } ${!message.readBy?.seller ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{message.subject}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                                                 {!message.readBy?.seller && (
                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                         )}
                      </div>
                      
                                             <p className="text-sm text-gray-600 mt-1">
                         From: {message.buyer?.name || 'Unknown'}
                       </p>
                       
                       <p className="text-sm text-gray-500 mt-1">
                         Property: {message.property?.title || 'Unknown Property'}
                       </p>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(message.lastMessageAt)}
                      </p>
                    </div>
                    
                                         <div className="flex space-x-1">
                       {!message.readBy?.seller && (
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
                      
                      {message.status !== 'closed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseMessage(message._id);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Close message"
                        >
                          <XMarkIcon className="h-4 w-4" />
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
              <p className="mt-2">Select a message to view conversation</p>
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
                   From: {selectedMessage.buyer?.name || 'Unknown'} ({selectedMessage.buyer?.email || 'No email'})
                 </p>
              </div>

                             {/* Message Thread */}
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {currentThread?.thread && currentThread.thread.length > 0 ? currentThread.thread.map((msg, index) => (
                  <div
                    key={index}
                                         className={`flex ${msg.sender?._id === selectedMessage.seller?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender?._id === selectedMessage.seller?._id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender?._id === selectedMessage.seller?._id
                          ? 'text-green-100'
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
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={loading || !replyText.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInquiries;
