import api from './api';

function buildQueryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join('&');
}

export const productService = {
  async getProducts(params = {}) {
    const query = buildQueryString(params);
    return api.get(`/products${query ? `?${query}` : ''}`);
  },

  async getById(id) {
    return api.get(`/products/${Number(id)}`);
  },
};

export default productService;
