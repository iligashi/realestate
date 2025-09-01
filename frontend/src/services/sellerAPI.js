import api from './api';

// Seller API
export const sellerAPI = {
  // Dashboard
  getDashboard: () => api.get('/seller/dashboard'),
  
  // Property Listing Wizard
  createPropertyListing: (propertyData) => {
    const config = {};
    
    // For FormData (file uploads), let the browser set the Content-Type with boundary
    if (!(propertyData instanceof FormData)) {
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    return api.post('/seller/properties', propertyData, config);
  },
  
  updatePropertyListing: (id, propertyData) => {
    const config = {};
    
    // For FormData (file uploads), let the browser set the Content-Type with boundary
    if (!(propertyData instanceof FormData)) {
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    return api.put(`/seller/properties/${id}`, propertyData, config);
  },
  
  updatePropertyPhotos: (id, photos) => api.put(`/seller/properties/${id}/photos`, { photos }),
  
  // Inquiry Dashboard
  getInquiries: (filters = {}) => api.get('/seller/inquiries', { params: filters }),
  getInquiryDetails: (id) => api.get(`/seller/inquiries/${id}`),
  respondToInquiry: (id, responseData) => api.post(`/seller/inquiries/${id}/respond`, responseData),
  
  // Listing Analytics
  getListingAnalytics: (filters = {}) => api.get('/seller/analytics', { params: filters }),
  getAnalyticsDetails: (id) => api.get(`/seller/analytics/${id}`),
  
  // Price Change History
  updatePropertyPrice: (id, priceData) => api.put(`/seller/properties/${id}/price`, priceData),
  getPriceHistory: (id) => api.get(`/seller/properties/${id}/price-history`),
  
  // Open House Scheduling
  createOpenHouse: (openHouseData) => api.post('/seller/open-houses', openHouseData),
  getOpenHouses: (status = 'upcoming') => api.get('/seller/open-houses', { params: { status } }),
  getOpenHouseDetails: (id) => api.get(`/seller/open-houses/${id}`),
  updateOpenHouse: (id, openHouseData) => api.put(`/seller/open-houses/${id}`, openHouseData),
  cancelOpenHouse: (id, reason) => api.delete(`/seller/open-houses/${id}`, { data: { reason } }),
  
  // Workflow Management
  updatePropertyWorkflow: (id, workflowData) => api.put(`/seller/properties/${id}/workflow`, workflowData),
};

export default sellerAPI;
