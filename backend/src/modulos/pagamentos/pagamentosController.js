import { createSubscription, verificarWebhook } from './stripeServico.js';
import { iniciarPagamento as mpesaIniciar, processarCallback as mpesaCallback } from './mpesaServico.js';
import { iniciarPagamento as emolaIniciar, processarCallback as emolaCallback } from './emolaServico.js';
import { filaWebhooks } from '../../config/filas.js';
import { sucesso } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

export const stripeCheckout = async (req, res, next) => {
  try {
    const tenant = await import('../tenants/tenantsServico.js').then(m => m.buscarTenant(req.tenant.id));
    const dados = await createSubscription(req.tenant.id, tenant.email, tenant.nome);
    sucesso(res, dados, 'Sessão de pagamento criada.');
  } catch (e) { next(e); }
};

// O webhook Stripe precisa do raw body — configurado no app.js antes do express.json().
export const stripeWebhook = async (req, res) => {
  const assinatura = req.headers['stripe-signature'];
  let evento;
  try {
    evento = verificarWebhook(req.rawBody, assinatura);
  } catch {
    return res.status(400).send('Webhook inválido.');
  }

  // Enqueue com ID do evento como job ID para deduplicação automática pelo BullMQ.
  await filaWebhooks.add(
    'stripe-evento',
    { tipo: evento.type, evento },
    { jobId: evento.id }
  );

  // Stripe exige resposta 200 imediata — o processamento é assíncrono.
  res.json({ recebido: true });
};

export const mpesaIniciarHandler = async (req, res, next) => {
  try {
    const dados = await mpesaIniciar(req.tenant.id, req.body);
    sucesso(res, dados, 'Pagamento M-Pesa iniciado. Aguarde confirmação no telemóvel.');
  } catch (e) { next(e); }
};

export const mpesaCallbackHandler = async (req, res) => {
  try {
    await mpesaCallback(req.body);
    res.json({ output_ResponseCode: 'INS-0' });
  } catch (err) {
    logger.error('Erro callback M-Pesa', { erro: err.message });
    res.json({ output_ResponseCode: 'INS-0' });
  }
};

export const emolaIniciarHandler = async (req, res, next) => {
  try {
    const dados = await emolaIniciar(req.tenant.id, req.body);
    sucesso(res, dados, 'Pagamento Emola iniciado. Aguarde confirmação no telemóvel.');
  } catch (e) { next(e); }
};

export const emolaCallbackHandler = async (req, res) => {
  try {
    await emolaCallback(req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Erro callback Emola', { erro: err.message });
    res.json({ status: 'ok' });
  }
};
