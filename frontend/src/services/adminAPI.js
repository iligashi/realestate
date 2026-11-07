import api from './api';

export const adminAPI = {
  // Dashboard Analytics
  getDashboardAnalytics: (token) => api.get('/admin/dashboard'),

  // User Management
  getAllUsers: (params, token) => api.get('/admin/users', {
    params
  }),
  updateUser: (userId, userData, token) => api.patch(`/admin/users/${userId}`, userData),
  deleteUser: (userId, token) => api.delete(`/admin/users/${userId}`),

  // Listing Management
  getAllListings: (params, token) => api.get('/admin/listings', {
    params
  }),
  updateListingStatus: (listingId, statusData, token) => api.patch(`/admin/listings/${listingId}/status`, statusData),
  deleteListing: (listingId, token) => api.delete(`/admin/listings/${listingId}`),

  // Reports & Moderation
  getAllReports: (params, token) => api.get('/admin/reports', {
    params
  }),
  resolveReport: (reportId, resolutionData, token) => api.patch(`/admin/reports/${reportId}/resolve`, resolutionData),

  // NEW: Platform Settings
  getPlatformSettings: (token) => api.get('/admin/settings'),
  updatePlatformSettings: (settingsData, token) => api.put('/admin/settings', settingsData),

  // NEW: Featured Listings
  getFeaturedListings: (token) => api.get('/admin/listings/featured'),
  updateFeaturedListing: (listingId, featuredData, token) => api.patch(`/admin/listings/${listingId}/featured`, featuredData),

  // NEW: System Announcements
  getAnnouncements: (token) => api.get('/admin/announcements'),
  createAnnouncement: (announcementData, token) => api.post('/admin/announcements', announcementData),
  updateAnnouncement: (announcementId, announcementData, token) => api.put(`/admin/announcements/${announcementId}`, announcementData),
  deleteAnnouncement: (announcementId, token) => api.delete(`/admin/announcements/${announcementId}`),

  // NEW: Revenue Analytics
  getRevenueAnalytics: (params, token) => api.get('/admin/analytics/revenue', {
    params
  }),

  // NEW: Enhanced Analytics
  getEnhancedAnalytics: (params, token) => api.get('/admin/analytics/enhanced', {
    params
  }),

  // Helper functions
  formatParams: (filters) => {
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params[key] = filters[key];
      }
    });
    return params;
  },

  handleResponse: (response) => {
    return response.data;
  },

  handleError: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    return error.message || 'An error occurred';
  }
};
