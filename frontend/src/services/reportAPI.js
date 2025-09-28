import api from './api';

const reportAPI = {
  // Create a new report
  createReport: async (reportData) => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  // Get user's own reports
  getMyReports: async (params = {}) => {
    try {
      const response = await api.get('/reports/my-reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my reports:', error);
      throw error;
    }
  },

  // Get specific report by ID
  getReport: async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  },

  // Report a property
  reportProperty: async (propertyId, reportData) => {
    try {
      const data = {
        reportedItemId: propertyId,
        reportedItemModel: 'property',
        ...reportData
      };
      return await reportAPI.createReport(data);
    } catch (error) {
      console.error('Error reporting property:', error);
      throw error;
    }
  },

  // Report a user
  reportUser: async (userId, reportData) => {
    try {
      const data = {
        reportedItemId: userId,
        reportedItemModel: 'user',
        ...reportData
      };
      return await reportAPI.createReport(data);
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  },

  // Report a message
  reportMessage: async (messageId, reportData) => {
    try {
      const data = {
        reportedItemId: messageId,
        reportedItemModel: 'message',
        ...reportData
      };
      return await reportAPI.createReport(data);
    } catch (error) {
      console.error('Error reporting message:', error);
      throw error;
    }
  }
};

export default reportAPI;
