import api from './api';

// Admin API service for all admin operations
export const adminAPI = {
  // ==================== DASHBOARD & ANALYTICS ====================
  
  // Get dashboard analytics
  getDashboardAnalytics: (token) => api.get('/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // ==================== USER MANAGEMENT ====================
  
  // Get all users with filters
  getAllUsers: (params, token) => api.get('/admin/users', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Update user (role, status, etc.)
  updateUser: (userId, userData, token) => api.patch(`/admin/users/${userId}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Delete user
  deleteUser: (userId, token) => api.delete(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // ==================== LISTING MANAGEMENT ====================
  
  // Get all listings with filters
  getAllListings: (params, token) => api.get('/admin/listings', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Update listing status (approve/reject)
  updateListingStatus: (listingId, statusData, token) => api.patch(`/admin/listings/${listingId}/status`, statusData, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Delete listing
  deleteListing: (listingId, token) => api.delete(`/admin/listings/${listingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // ==================== REPORTS & MODERATION ====================
  
  // Get all reports with filters
  getAllReports: (params, token) => api.get('/admin/reports', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Resolve report
  resolveReport: (reportId, resolutionData, token) => api.patch(`/admin/reports/${reportId}/resolve`, resolutionData, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // ==================== UTILITY FUNCTIONS ====================
  
  // Helper to format API parameters
  formatParams: (filters) => {
    const params = {};
    
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.role) params.role = filters.role;
    if (filters.type) params.type = filters.type;
    if (filters.propertyType) params.propertyType = filters.propertyType;
    
    return params;
  },

  // Helper to handle API responses
  handleResponse: (response) => {
    if (response.data) {
      return response.data;
    }
    throw new Error('No data received from API');
  },

  // Helper to handle API errors
  handleError: (error) => {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'An error occurred');
  }
};
