import api from './api';

const userReportsAPI = {
  // Get reports made against the user
  getReportsAgainstMe: async (params = {}) => {
    try {
      const response = await api.get('/reports/against-me', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports against me:', error);
      throw error;
    }
  },

  // Get user's own reports (reports they made)
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
  }
};

export default userReportsAPI;
