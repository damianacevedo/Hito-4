import api from './api';

export const productService = {
  async getById(id) {
    return api.get(`/products/${Number(id)}`);
  },
};

export default productService;
