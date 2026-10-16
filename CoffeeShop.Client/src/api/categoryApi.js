import axiosClient from './axiosClient';

export const categoryApi = {
  getAll: (activeOnly) => axiosClient.get('/categories', { params: { activeOnly } }),
  getById: (id) => axiosClient.get(`/categories/${id}`),
  create: (data) => axiosClient.post('/categories', data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  delete: (id) => axiosClient.delete(`/categories/${id}`),
};
