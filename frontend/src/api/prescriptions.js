import api from './axios';

export const uploadPrescription   = (fd) => api.post('/prescriptions', fd);
export const getMyPrescriptions   = ()   => api.get('/prescriptions/my');
export const deletePrescription   = (id) => api.delete(`/prescriptions/${id}`);
// Admin
export const getAllPrescriptions  = (params) => api.get('/prescriptions', { params });
export const updatePrescriptionStatus = (id, data) => api.patch(`/prescriptions/${id}`, data);
