import api from './api.js';

// Busca o estado actual da assinatura do tenant.
export const buscar = () => api.get('/assinatura');

// Cria uma sessão Stripe Checkout para subscrição do plano escolhido.
export const criarSessaoStripe = (plano) => api.post('/assinatura/stripe', { plano });

// Inicia o fluxo de pagamento via M-Pesa com o número fornecido.
export const iniciarMpesa = (numero) => api.post('/assinatura/mpesa', { numero });

// Inicia o fluxo de pagamento via Emola com o número fornecido.
export const iniciarEmola = (numero) => api.post('/assinatura/emola', { numero });

// Cancela a assinatura activa no fim do período de facturação.
export const cancelar = () => api.post('/assinatura/cancelar');
