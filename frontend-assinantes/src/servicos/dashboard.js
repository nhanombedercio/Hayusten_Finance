import api from './api.js';

// Busca todos os dados do dashboard: saldos, gráficos, transacções recentes e metas.
export const buscarDashboard = (params = {}) => api.get('/dashboard', { params });
