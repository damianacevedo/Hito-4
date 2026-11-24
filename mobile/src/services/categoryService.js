import api from './api';

const categoryService = {
  getCategories() {
    return api.get('/categories');
  },
};

export default categoryService;
