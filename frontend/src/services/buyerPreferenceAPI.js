import api from './api';

export const buyerPreferenceAPI = {
  // Saved searches
  async getSavedSearches() {
    const response = await api.get('/preferences/saved-searches');
    return response.data;
  },

  async createSavedSearch(payload) {
    const response = await api.post('/preferences/saved-searches', payload);
    return response.data;
  },

  async updateSavedSearch(searchId, payload) {
    const response = await api.put(`/preferences/saved-searches/${searchId}`, payload);
    return response.data;
  },

  async deleteSavedSearch(searchId) {
    const response = await api.delete(`/preferences/saved-searches/${searchId}`);
    return response.data;
  },

  // Property alerts
  async getPropertyAlerts() {
    const response = await api.get('/preferences/property-alerts');
    return response.data;
  },

  async createPropertyAlert(payload) {
    const response = await api.post('/preferences/property-alerts', payload);
    return response.data;
  },

  async updatePropertyAlert(alertId, payload) {
    const response = await api.put(`/preferences/property-alerts/${alertId}`, payload);
    return response.data;
  },

  async deletePropertyAlert(alertId) {
    const response = await api.delete(`/preferences/property-alerts/${alertId}`);
    return response.data;
  }
};

export default buyerPreferenceAPI;

