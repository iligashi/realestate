import api from './api';

export const favoriteAPI = {
  async getFavorites(params = {}) {
    const response = await api.get('/favorites', { params });
    return response.data;
  },

  async addFavorite(propertyId, payload = {}) {
    const response = await api.post('/favorites', {
      propertyId,
      ...payload
    });
    return response.data;
  },

  async updateFavorite(favoriteId, updates) {
    const response = await api.patch(`/favorites/${favoriteId}`, updates);
    return response.data;
  },

  async removeFavorite(favoriteId) {
    const response = await api.delete(`/favorites/${favoriteId}`);
    return response.data;
  },

  async removeFavoriteByProperty(propertyId) {
    const response = await api.delete(`/favorites/property/${propertyId}`);
    return response.data;
  }
};

export default favoriteAPI;

