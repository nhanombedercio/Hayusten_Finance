import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { tenants, pagamentos } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { emTransacao } from '../../utils/transacao.js';
import { ErroIntegracao } from '../../utils/erros.js';
import { logger } from '../../utils/logger.js';
import * as tenantsServico from '../tenants/tenantsServico.js';
import { enviarPagamentoConfirmado, enviarPagamentoFalhado, enviarAvisoRenovacao } from '../../utils/email.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createSubscription(tenantId, email, nome) {
  try {
    const [existente] = await db.select({ stripeCustomerId: tenants.stripeCustomerId })
      .from(tenants).where(eq(tenants.id, tenantId)).limit(1);

    let customerId = existente?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({ email, name: nome, metadata: { tenantId } });
      customerId = customer.id;
      await db.update(tenants).set({ stripeCustomerId: customerId }).where(eq(tenants.id, tenantId));
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRECO_PREMIUM, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso`,
      cancel_url: `${process.env.FRONTEND_URL}/assinatura/cancelado`,
      metadata: { tenantId },
    });

    return { url: session.url };
  } catch (err) {
    throw new ErroIntegracao('Stripe', 'Não foi possível criar a sessão de pagamento.', err);
  }
}

export async function cancelSubscription(subscriptionId) {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (err) {
    throw new ErroIntegracao('Stripe', 'Não foi possível cancelar a assinatura.', err);
  }
}

// Verifica assinatura do webhook e devolve o evento Stripe parsed.
export function verificarWebhook(payload, assinatura) {
  try {
    return stripe.webhooks.constructEvent(payload, assinatura, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new ErroIntegracao('Stripe', 'Assinatura de webhook inválida.', err);
  }
}

// Handlers individuais por tipo de evento — chamados pelo webhookWorker.
export async function handleSubscriptionCreated(evento) {
  const sub = evento.data.object;
  const tenantId = sub.metadata?.tenantId;
  if (!tenantId) return;

  await emTransacao(async (tx) => {
    await tx.update(tenants).set({
      stripeSubscriptionId: sub.id,
      estado: 'activo',
      assinaturaActiva: true,
      proximaRenovacao: new Date(sub.current_period_end * 1000),
      actualizadoEm: new Date(),
    }).where(eq(tenants.id, tenantId));
  });

  logger.info('Assinatura Stripe criada', { tenantId, subscriptionId: sub.id });
}

export async function handleSubscriptionDeleted(evento) {
  const sub = evento.data.object;
  const tenantId = sub.metadata?.tenantId;
  if (!tenantId) return;

  await tenantsServico.cancelar(tenantId, new Date(sub.current_period_end * 1000));
}

export async function handlePaymentSucceeded(evento) {
  const invoice = evento.data.object;
  const tenant = await buscarTenantPorStripeId(invoice.customer);
  if (!tenant) return;

  const periodoFim = new Date(invoice.lines.data[0]?.period?.end * 1000);

  await emTransacao(async (tx) => {
    await tx.insert(pagamentos).values({
      id: uuidv4(),
      tenantId: tenant.id,
      metodo: 'stripe',
      valor: String(invoice.amount_paid / 100),
      moeda: invoice.currency.toUpperCase(),
      estado: 'confirmado',
      referencia: invoice.id,
      plano: 'premium',
      periodoInicio: new Date(invoice.lines.data[0]?.period?.start * 1000).toISOString().slice(0, 10),
      periodoFim: periodoFim.toISOString().slice(0, 10),
      metadados: { invoiceId: invoice.id },
    });

    await tx.update(tenants).set({
      estado: 'activo',
      assinaturaActiva: true,
      proximaRenovacao: periodoFim,
      actualizadoEm: new Date(),
    }).where(eq(tenants.id, tenant.id));
  });

  await enviarPagamentoConfirmado(
    tenant.email, tenant.nome,
    `${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
    periodoFim.toLocaleDateString('pt-PT')
  );
}

export async function handlePaymentFailed(evento) {
  const invoice = evento.data.object;
  const tenant = await buscarTenantPorStripeId(invoice.customer);
  if (!tenant) return;

  await db.insert(pagamentos).values({
    id: uuidv4(),
    tenantId: tenant.id,
    metodo: 'stripe',
    valor: String(invoice.amount_due / 100),
    moeda: invoice.currency.toUpperCase(),
    estado: 'falhado',
    referencia: invoice.id,
    plano: 'premium',
    metadados: { invoiceId: invoice.id, motivo: invoice.last_finalization_error?.message },
  });

  await enviarPagamentoFalhado(tenant.email, tenant.nome);
}

async function buscarTenantPorStripeId(stripeCustomerId) {
  const [tenant] = await db.select({ id: tenants.id, email: tenants.email, nome: tenants.nome })
    .from(tenants).where(eq(tenants.stripeCustomerId, stripeCustomerId)).limit(1);
  return tenant || null;
}
