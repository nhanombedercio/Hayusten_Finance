import axios from 'axios';
import { useAdminStore } from '../store/adminStore.js';

// Instância axios para chamadas ao painel admin.
// Todas as rotas admin requerem tanto o JWT como a chave secreta X-Admin-Key.
const api = axios.create({
  baseURL: '/admin',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const { adminToken, adminKey } = useAdminStore.getState();
  if (adminToken) {
    // O servidor exige ambos: JWT para identificar o utilizador e X-Admin-Key como
    // segunda camada de segurança para confirmar que é o painel admin legítimo.
    config.headers['Authorization'] = `Bearer ${adminToken}`;
    config.headers['X-Admin-Key'] = adminKey || '';
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
