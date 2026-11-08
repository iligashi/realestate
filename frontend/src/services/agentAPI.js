import api from './api';

export const agentAPI = {
  getDashboard: () => api.get('/agent/dashboard'),
  getListings: (params) => api.get('/agent/listings', { params }),
  updateStatus: (id, status) => api.patch(`/agent/listings/${id}/status`, { status }),
  // Public directory
  listAgents: (params) => api.get('/agents', { params }),
  getAgent: (id) => api.get(`/agents/${id}`)
};

export const publicAPI = {
  getSettings: () => api.get('/settings')
};
