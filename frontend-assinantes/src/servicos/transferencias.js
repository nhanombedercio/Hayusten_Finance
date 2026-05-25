import api from './api.js';

export const listar = (params = {}) => api.get('/transferencias', { params });
export const criar = (dados) => api.post('/transferencias', dados);
export const eliminar = (id) => api.delete(`/transferencias/${id}`);
