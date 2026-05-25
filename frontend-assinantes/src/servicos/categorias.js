import api from './api.js';

export const listar = () => api.get('/categorias');
export const criar = (dados) => api.post('/categorias', dados);
export const actualizar = (id, dados) => api.put(`/categorias/${id}`, dados);
export const eliminar = (id) => api.delete(`/categorias/${id}`);
