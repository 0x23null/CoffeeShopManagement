import axiosClient from './axiosClient';

export const tableApi = {
  getAll: (activeOnly) => axiosClient.get('/tables', { params: { activeOnly } }),
  getById: (id) => axiosClient.get(`/tables/${id}`),
  create: (data) => axiosClient.post('/tables', data),
  update: (id, data) => axiosClient.put(`/tables/${id}`, data),
  delete: (id) => axiosClient.delete(`/tables/${id}`),
};
