import api from './api.js';

export const listar = () => api.get('/metas');
export const criar = (dados) => api.post('/metas', dados);
export const actualizar = (id, dados) => api.put(`/metas/${id}`, dados);
export const eliminar = (id) => api.delete(`/metas/${id}`);

// Adiciona um depósito/contribuição a uma meta específica.
export const adicionarContribuicao = (id, dados) => api.post(`/metas/${id}/contribuicoes`, dados);

// Remove uma contribuição específica de uma meta.
export const eliminarContribuicao = (metaId, contribuicaoId) =>
  api.delete(`/metas/${metaId}/contribuicoes/${contribuicaoId}`);
