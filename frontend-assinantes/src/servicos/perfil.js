import api from './api.js';

// Actualiza os dados pessoais do utilizador autenticado.
export const actualizarPerfil = (dados) => api.put('/perfil', dados);

// Altera a password do utilizador exigindo a password actual por segurança.
export const alterarPassword = (dados) => api.put('/perfil/password', dados);

// Actualiza as preferências do utilizador (moeda, relatórios por email, etc.).
export const actualizarPreferencias = (dados) => api.put('/perfil/preferencias', dados);
