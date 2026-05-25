import api from './api.js';

// Lista todos os insights gerados pelo sistema, ordenados por relevância.
export const listar = () => api.get('/insights');

// Marca um insight como lido para não aparecer em destaque.
export const marcarLido = (id) => api.patch(`/insights/${id}/lido`);
