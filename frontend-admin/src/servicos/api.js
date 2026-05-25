import axios from 'axios';
import { useAdminStore } from '../store/adminStore.js';

// Instância axios para chamadas ao painel admin.
// Todas as rotas admin requerem tanto o JWT como a chave secreta X-Admin-Key.
const api = axios.create({
  baseURL: '/admin',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const { adminToken } = useAdminStore.getState();
  if (adminToken) {
    config.headers['Authorization'] = `Bearer ${adminToken}`;
    // A chave admin é guardada no token após login — o servidor valida ambos.
    config.headers['X-Admin-Key'] = import.meta.env.VITE_ADMIN_KEY || '';
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (erro) => {
    if (erro.response?.status === 401 || erro.response?.status === 403) {
      // Sessão inválida — limpa e redireciona para login.
      useAdminStore.getState().limparAuth();
      window.location.href = '/login';
    }
    return Promise.reject(erro);
  }
);

export default api;
