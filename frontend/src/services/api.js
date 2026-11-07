import axios from 'axios';
import { API_URL } from '../config';

// The session lives in an httpOnly cookie set by the API, so requests just
// need to include credentials. X-Requested-With is required by the API for
// cookie-authenticated writes (CSRF protection).
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' }
});

// Older call sites still pass a token argument; never send an empty Bearer header
api.interceptors.request.use((config) => {
  const auth = config.headers?.Authorization;
  if (typeof auth === 'string' && /^Bearers*(null|undefined)?$/.test(auth)) {
    delete config.headers.Authorization;
  }
  return config;
});

// Let the app know when the session has expired (handled in SessionProvider)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: (token) => api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (profileData, token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // Explicitly set Content-Type based on data type
    if (profileData instanceof FormData) {
      // For FormData (file uploads), let the browser set the Content-Type with boundary
    } else {
      // For JSON data, set Content-Type explicitly
      config.headers['Content-Type'] = 'application/json';
    }
    
    return api.put('/auth/profile', profileData, config);
  },
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  extendSession: () => api.post('/auth/extend-session'),
  logout: () => api.post('/auth/logout'),
};

// Property API
export const propertyAPI = {
  getProperties: (filters = {}) => api.get('/properties', { params: filters }),
  getProperty: (id) => api.get(`/properties/${id}`),
  createProperty: (propertyData, token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // For FormData (file uploads), let the browser set the Content-Type with boundary
    if (!(propertyData instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return api.post('/properties', propertyData, config);
  },
  updateProperty: (id, propertyData, token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // For FormData (file uploads), let the browser set the Content-Type with boundary
    if (!(propertyData instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return api.put(`/properties/${id}`, propertyData, config);
  },
  deleteProperty: (id, token) => api.delete(`/properties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getUserProperties: (token) => api.get('/properties/user/my-properties', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// User API
export const userAPI = {
  getAllUsers: (token) => api.get('/users', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getUserById: (id, token) => api.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateUser: (id, userData, token) => api.put(`/users/${id}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteUser: (id, token) => api.delete(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  toggleUserBlock: (id, token) => api.patch(`/users/${id}/toggle-block`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getUserStats: (token) => api.get('/users/stats', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export default api;
