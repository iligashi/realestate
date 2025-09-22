import api from './api';

export const adminAPI = {
  // Dashboard Analytics
  getDashboardAnalytics: (token) => api.get('/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // User Management
  getAllUsers: (params, token) => api.get('/admin/users', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateUser: (userId, userData, token) => api.patch(`/admin/users/${userId}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteUser: (userId, token) => api.delete(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Listing Management
  getAllListings: (params, token) => api.get('/admin/listings', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateListingStatus: (listingId, statusData, token) => api.patch(`/admin/listings/${listingId}/status`, statusData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteListing: (listingId, token) => api.delete(`/admin/listings/${listingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Reports & Moderation
  getAllReports: (params, token) => api.get('/admin/reports', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),
  resolveReport: (reportId, resolutionData, token) => api.patch(`/admin/reports/${reportId}/resolve`, resolutionData, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // NEW: Platform Settings
  getPlatformSettings: (token) => api.get('/admin/settings', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updatePlatformSettings: (settingsData, token) => api.put('/admin/settings', settingsData, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // NEW: Featured Listings
  getFeaturedListings: (token) => api.get('/admin/listings/featured', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateFeaturedListing: (listingId, featuredData, token) => api.patch(`/admin/listings/${listingId}/featured`, featuredData, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // NEW: System Announcements
  getAnnouncements: (token) => api.get('/admin/announcements', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createAnnouncement: (announcementData, token) => api.post('/admin/announcements', announcementData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateAnnouncement: (announcementId, announcementData, token) => api.put(`/admin/announcements/${announcementId}`, announcementData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteAnnouncement: (announcementId, token) => api.delete(`/admin/announcements/${announcementId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // NEW: Revenue Analytics
  getRevenueAnalytics: (params, token) => api.get('/admin/analytics/revenue', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),

  // NEW: Enhanced Analytics
  getEnhancedAnalytics: (params, token) => api.get('/admin/analytics/enhanced', {
    params,
    headers: { Authorization: `Bearer ${token}` }
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
