import axiosClient from './axiosClient';

export const reportApi = {
  getSummary: () => axiosClient.get('/reports/summary'),
  getTopProducts: (top = 5) => axiosClient.get('/reports/top-products', { params: { top } }),
};
