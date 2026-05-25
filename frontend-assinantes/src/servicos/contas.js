import api from './api.js';

export const listar = () => api.get('/contas');
export const criar = (dados) => api.post('/contas', dados);
export const actualizar = (id, dados) => api.put(`/contas/${id}`, dados);
export const eliminar = (id) => api.delete(`/contas/${id}`);

// Guarda a nova ordem das contas para reordenação via drag-and-drop.
export const reordenar = (ids) => api.put('/contas/reordenar', { ids });
