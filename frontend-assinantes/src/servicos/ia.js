import api from './api.js';

// Calcula o score de saúde financeira do tenant (0-100).
export const score = () => api.get('/ia/score');

// Gera previsões de despesa por categoria para o próximo mês.
export const previsoes = () => api.get('/ia/previsoes');

// Projecta a evolução do saldo para os próximos N meses.
export const projecao = (meses) => api.get('/ia/projecao', { params: { meses } });

// Simula um cenário hipotético de receita/despesa e calcula impacto.
export const simularCenario = (dados) => api.post('/ia/simular', dados);

// Calcula quanto poupar por mês para atingir uma meta específica.
export const calcularMeta = (metaId) => api.get(`/ia/metas/${metaId}`);

// Envia uma mensagem ao assistente IA com histórico de conversa.
export const chat = (mensagem, historico = []) =>
  api.post('/ia/chat', { mensagem, historico });
