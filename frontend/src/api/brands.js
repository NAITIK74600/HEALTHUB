import api from './axios';

export const getBrands        = (params) => api.get('/brands', { params });
export const getAdminBrands   = ()       => api.get('/brands/admin/all');
export const createBrand      = (data)   => api.post('/brands', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateBrand      = (id, data) => api.put(`/brands/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteBrand      = (id)     => api.delete(`/brands/${id}`);
