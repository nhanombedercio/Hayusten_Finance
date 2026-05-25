import axios from 'axios';
import useAuthStore from '../store/authStore.js';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // necessário para cookie httpOnly do refresh token
});

// Injeta o token de acesso em cada pedido antes de ser enviado.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Variável de controlo para evitar múltiplas renovações simultâneas.
let aRenovar = false;
let filaEspera = [];

const processarFila = (erro, token = null) => {
  filaEspera.forEach(({ resolve, reject }) => {
    if (erro) {
      reject(erro);
    } else {
      resolve(token);
    }
  });
  filaEspera = [];
};

// Ao receber 401, tenta renovar o token silenciosamente antes de rejeitar o pedido.
// Se a renovação falhar, limpa a sessão e redireciona para login.
api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const pedidoOriginal = erro.config;

    if (erro.response?.status === 401 && !pedidoOriginal._jaRenou) {
      if (aRenovar) {
        // Outro pedido já está a renovar — coloca este na fila de espera.
        return new Promise((resolve, reject) => {
          filaEspera.push({ resolve, reject });
        }).then((token) => {
          pedidoOriginal.headers.Authorization = `Bearer ${token}`;
          return api(pedidoOriginal);
        });
      }

      pedidoOriginal._jaRenou = true;
      aRenovar = true;

      try {
        const { data } = await axios.post('/api/auth/renovar', {}, { withCredentials: true });
        const novoToken = data.dados?.accessToken;

        useAuthStore.getState().actualizarToken(novoToken);
        processarFila(null, novoToken);

        pedidoOriginal.headers.Authorization = `Bearer ${novoToken}`;
        return api(pedidoOriginal);
      } catch (erroRenovacao) {
        // Renovação falhou — sessão expirada definitivamente, limpar e redirecionar.
        processarFila(erroRenovacao);
        useAuthStore.getState().limparAuth();
        window.location.href = '/login';
        return Promise.reject(erroRenovacao);
      } finally {
        aRenovar = false;
      }
    }

    return Promise.reject(erro);
  }
);

export default api;
