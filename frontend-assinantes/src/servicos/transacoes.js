import api from './api.js';

// Lista transacções com suporte a filtros: data, tipo, conta, categoria, texto, pagina.
export const listar = (params = {}) => api.get('/transacoes', { params });

// Cria uma nova transacção (receita ou despesa).
export const criar = (dados) => api.post('/transacoes', dados);

// Actualiza uma transacção existente pelo seu id.
export const actualizar = (id, dados) => api.put(`/transacoes/${id}`, dados);

// Elimina uma transacção pelo seu id.
export const eliminar = (id) => api.delete(`/transacoes/${id}`);
