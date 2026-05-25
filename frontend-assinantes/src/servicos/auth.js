import api from './api.js';

// Regista um novo tenant com o utilizador administrador inicial.
export const registar = (dados) => api.post('/auth/registar', dados);

// Autentica o utilizador e retorna utilizador + tenant + accessToken.
export const login = (email, password) => api.post('/auth/login', { email, password });

// Invalida o refresh token no servidor e limpa a sessão.
export const logout = () => api.post('/auth/logout');

// Confirma o email do utilizador com o token recebido por email.
export const confirmarEmail = (token) => api.post('/auth/confirmar-email', { token });

// Envia email com link para redefinir a password.
export const recuperarPassword = (email) => api.post('/auth/recuperar-password', { email });

// Define nova password usando o token do email de recuperação.
export const definirPassword = (token, password) =>
  api.post('/auth/definir-password', { token, password });

// Renova o access token usando o refresh token em cookie httpOnly.
export const renovarToken = () => api.post('/auth/renovar');

// Guarda a configuração inicial do tenant após confirmação de email.
export const configurarInicial = (dados) => api.post('/conta/configurar', dados);
