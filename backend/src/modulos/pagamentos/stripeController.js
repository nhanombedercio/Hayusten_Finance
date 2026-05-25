import Stripe from 'stripe';
import { db } from '../../config/baseDados.js';
import { tenants, pagamentos } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { filaWebhooks } from '../../config/filas.js';
import { sucesso, erro } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function criarSessao(req, res, next) {
  try {
    const [tenant] = await db
      .select({ id: tenants.id, email: tenants.email, stripeCustomerId: tenants.stripeCustomerId })
      .from(tenants)
      .where(eq(tenants.id, req.tenant.id))
      .limit(1);

    // Cria ou reutiliza o customer Stripe para este tenant
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.email,
        metadata: { tenantId: tenant.id },
      });
      customerId = customer.id;
      await db.update(tenants)
        .set({ stripeCustomerId: customerId, actualizadoEm: new Date() })
        .where(eq(tenants.id, tenant.id));
    }

    const sessao = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID_PREMIUM, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/assinatura`,
      metadata: { tenantId: tenant.id },
    });

    sucesso(res, { url: sessao.url });
  } catch (err) { next(err); }
}

// Webhook Stripe — recebe corpo raw, responde 200 imediatamente, enfileira para processamento.
// Resposta imediata é obrigatória — Stripe tem timeout de 30s e marca webhook como falhado se demorar.
export async function webhook(req, res) {
  let evento;
  try {
    evento = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.warn('Assinatura de webhook Stripe inválida', { erro: err.message });
    return erro(res, 'Assinatura inválida.', 400);
  }

  // Resposta imediata — o processamento acontece assíncronamente na fila BullMQ
  res.status(200).json({ recebido: true });

  // jobId = event.id garante deduplicação: BullMQ ignora jobs com o mesmo ID
  await filaWebhooks.add('stripe', { evento }, {
    jobId: evento.id,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  }).catch((err) => {
    logger.error('Falha ao enfileirar evento Stripe', { eventoId: evento.id, erro: err.message });
  });
}
