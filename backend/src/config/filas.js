import { Queue } from 'bullmq';
import { redisFilas } from './redis.js';

// Configuração de conexão partilhada por todas as filas.
// BullMQ gere os seus próprios prefixos internamente — não interferimos.
const conexao = { connection: redisFilas };

// Fila de emails transaccionais (confirmação, trial, pagamentos, relatórios).
// Separada das outras para poder pausar/escalar o processamento de email independentemente.
export const filaEmails = new Queue('emails', conexao);

// Fila de webhooks externos (Stripe, M-Pesa, Emola).
// Separada para controlar retries e prioridade sem afetar outras filas.
export const filaWebhooks = new Queue('webhooks', conexao);

// Fila de geração de insights financeiros por tenant.
// Corre em background sem bloquear pedidos HTTP.
export const filaInsights = new Queue('insights', conexao);

// Fila de geração e envio de relatórios mensais.
// Pode demorar mais tempo — separada para não ocupar workers de outras filas.
export const filaRelatorios = new Queue('relatorios', conexao);
