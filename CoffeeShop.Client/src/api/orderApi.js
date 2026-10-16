import axiosClient from './axiosClient';

export const orderApi = {
  create: (tableId) => axiosClient.post('/orders', { tableId }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  addOrUpdateItem: (orderId, productId, quantity) => 
    axiosClient.post(`/orders/${orderId}/items`, { productId, quantity }),
  removeItem: (orderId, productId) => 
    axiosClient.delete(`/orders/${orderId}/items/${productId}`),
  processPayment: (orderId, data) => 
    axiosClient.post(`/orders/${orderId}/payment`, data),
  cancel: (orderId) => 
    axiosClient.post(`/orders/${orderId}/cancel`),
  searchHistory: (params) => 
    axiosClient.get('/orders/search', { params }),
};
