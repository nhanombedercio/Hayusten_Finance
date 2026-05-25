import api from './api.js';

// Login do admin — retorna o JWT de acesso.
export async function loginAdmin(email, password, adminKey) {
  const resposta = await api.post('/auth/admin/login', { email, password, adminKey });
  return resposta.data;
}

// Métricas globais do negócio.
export async function buscarMetricas() {
  const resposta = await api.get('/metricas');
  return resposta.data;
}

// Listagem de tenants com filtros opcionais.
export async function listarTenants(params = {}) {
  const resposta = await api.get('/tenants', { params });
  return resposta.data;
}

// Detalhe de um tenant específico.
export async function buscarTenant(id) {
  const resposta = await api.get(`/tenants/${id}`);
  return resposta.data;
}

// Suspender um tenant.
export async function suspenderTenant(id) {
  const resposta = await api.post(`/tenants/${id}/suspender`);
  return resposta.data;
}

// Reactivar um tenant suspenso.
export async function reactivarTenant(id) {
  const resposta = await api.post(`/tenants/${id}/reactivar`);
  return resposta.data;
}

// Iniciar eliminação RGPD de um tenant.
export async function eliminarTenant(id) {
  const resposta = await api.delete(`/tenants/${id}`);
  return resposta.data;
}

// Histórico de pagamentos processados.
export async function listarPagamentos(params = {}) {
  const resposta = await api.get('/pagamentos', { params });
  return resposta.data;
}
