import api from './api';

const orderService = {
  async getMyOrders() {
    return api.get('/orders');
  },

  async getById(orderId) {
    return api.get(`/orders/${Number(orderId)}`);
  },

  async cancel(orderId) {
    return api.patch(`/orders/${Number(orderId)}/status`, {
      status: 'cancelado',
    });
  },
};

export default orderService;
