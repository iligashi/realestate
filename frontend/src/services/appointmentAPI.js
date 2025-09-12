const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Create a viewing request
export const createViewingRequest = async (propertyId, viewingData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/appointments/viewing`, {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        ...viewingData
      }),
    });

    return response;
  } catch (error) {
    console.error('Error creating viewing request:', error);
    throw error;
  }
};

// Get user appointments
export const getUserAppointments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.propertyId) queryParams.append('propertyId', filters.propertyId);

    const url = `${API_BASE_URL}/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await makeAuthenticatedRequest(url);

    return response;
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    throw error;
  }
};

// Get upcoming appointments
export const getUpcomingAppointments = async (propertyId = null) => {
  try {
    const queryParams = new URLSearchParams();
    if (propertyId) queryParams.append('propertyId', propertyId);

    const url = `${API_BASE_URL}/appointments/upcoming${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await makeAuthenticatedRequest(url);

    return response;
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
};

// Get appointment details
export const getAppointmentDetails = async (appointmentId) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/appointments/${appointmentId}`);

    return response;
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    throw error;
  }
};

// Confirm an appointment
export const confirmAppointment = async (appointmentId) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/appointments/${appointmentId}/confirm`, {
      method: 'PATCH',
    });

    return response;
  } catch (error) {
    console.error('Error confirming appointment:', error);
    throw error;
  }
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId, reason = '') => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });

    return response;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

// Reschedule an appointment
export const rescheduleAppointment = async (appointmentId, newDate, newTime, reason = '') => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/appointments/${appointmentId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({
        newDate,
        newTime,
        reason
      }),
    });

    return response;
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    throw error;
  }
};

export default {
  createViewingRequest,
  getUserAppointments,
  getUpcomingAppointments,
  getAppointmentDetails,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment
};
