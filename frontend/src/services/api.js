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

// Safety net: never send an empty or placeholder Bearer header
const EMPTY_BEARER = /^Bearer\s*(null|undefined)?$/;
api.interceptors.request.use((config) => {
  const auth = config.headers?.get ? config.headers.get('Authorization') : config.headers?.Authorization;
  if (typeof auth === 'string' && EMPTY_BEARER.test(auth)) {
    if (config.headers.delete) config.headers.delete('Authorization');
    else delete config.headers.Authorization;
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
  getProfile: (token) => api.get('/auth/profile'),
  updateProfile: (profileData, token) => {
    const config = { headers: {} };
    
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
    const config = { headers: {} };
    
    // For FormData (file uploads), let the browser set the Content-Type with boundary
    if (!(propertyData instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return api.post('/properties', propertyData, config);
  },
  updateProperty: (id, propertyData, token) => {
    const config = { headers: {} };
    
    // For FormData (file uploads), let the browser set the Content-Type with boundary
    if (!(propertyData instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return api.put(`/properties/${id}`, propertyData, config);
  },
  deleteProperty: (id, token) => api.delete(`/properties/${id}`),
  getUserProperties: (token) => api.get('/properties/user/my-properties'),
};

// User API
export const userAPI = {
  getAllUsers: (token) => api.get('/users'),
  getUserById: (id, token) => api.get(`/users/${id}`),
  updateUser: (id, userData, token) => api.put(`/users/${id}`, userData),
  deleteUser: (id, token) => api.delete(`/users/${id}`),
  toggleUserBlock: (id, token) => api.patch(`/users/${id}/toggle-block`, {}),
  getUserStats: (token) => api.get('/users/stats'),
};

export default api;
