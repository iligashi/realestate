import api from './api';

export const messageAPI = {
  // Create a new message
  createMessage: (messageData) => api.post('/messages', messageData),

  // Get messages for the authenticated user
  getMessages: (params = {}) => {
    // Remove empty parameters to prevent duplicate cache keys
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value != null)
    );
    return api.get('/messages', { params: cleanParams });
  },

  // Get a specific message thread
  getMessageThread: (messageId) => api.get(`/messages/${messageId}`),

  // Reply to a message
  replyToMessage: (messageId, message) => api.post(`/messages/${messageId}/reply`, { message }),

  // Mark message as read
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),

  // Get unread message count
  getUnreadCount: () => api.get('/messages/unread-count'),

  // Close a message thread
  closeMessage: (messageId) => api.patch(`/messages/${messageId}/close`)
};

export default messageAPI;
