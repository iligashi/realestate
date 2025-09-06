import api from './api';

const rentalApplicationAPI = {
  // Create a new rental application
  createApplication: async (propertyId, applicationData) => {
    const response = await api.post(`/rental-applications/${propertyId}`, applicationData);
    return response.data;
  },

  // Get applications for landlord
  getLandlordApplications: async (params = {}) => {
    const response = await api.get('/rental-applications/landlord', { params });
    return response.data;
  },

  // Get applications for applicant
  getApplicantApplications: async (params = {}) => {
    const response = await api.get('/rental-applications/applicant', { params });
    return response.data;
  },

  // Get specific application
  getApplication: async (applicationId) => {
    const response = await api.get(`/rental-applications/${applicationId}`);
    return response.data;
  },

  // Update application status (approve/reject)
  updateApplicationStatus: async (applicationId, status, reason, notes) => {
    const response = await api.patch(`/rental-applications/${applicationId}/status`, {
      status,
      reason,
      notes
    });
    return response.data;
  },

  // Add message to application
  addApplicationMessage: async (applicationId, message) => {
    const response = await api.post(`/rental-applications/${applicationId}/messages`, {
      message
    });
    return response.data;
  },

  // Withdraw application
  withdrawApplication: async (applicationId) => {
    const response = await api.patch(`/rental-applications/${applicationId}/withdraw`);
    return response.data;
  }
};

export default rentalApplicationAPI;
