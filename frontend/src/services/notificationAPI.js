import api from './api';

const notificationAPI = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  async deleteReadNotifications() {
    const response = await api.delete('/notifications/read');
    return response.data;
  }
};

export default notificationAPI;

