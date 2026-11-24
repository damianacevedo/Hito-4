import api from './api';

export const favoriteService = {
  async getFavorites() {
    const data = await api.get('/favorites');
    return Array.isArray(data) ? data : [];
  },

  async addFavorite(productId) {
    return api.post(`/favorites/${Number(productId)}`);
  },

  async removeFavorite(productId) {
    return api.delete(`/favorites/${Number(productId)}`);
  },
};

export default favoriteService;
