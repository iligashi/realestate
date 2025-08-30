import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
};

// Property API
export const propertyAPI = {
  getProperties: (filters = {}) => api.get('/properties', { params: filters }),
  getProperty: (id) => api.get(`/properties/${id}`),
  createProperty: (propertyData, token) => api.post('/properties', propertyData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProperty: (id, propertyData, token) => api.put(`/properties/${id}`, propertyData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
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
