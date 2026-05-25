import { Worker } from 'bullmq';
import { redisFilas } from '../../../config/redis.js';
import {
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from '../stripeServico.js';
import { logger } from '../../../utils/logger.js';

// Worker processa eventos Stripe de forma assíncrona para garantir que o endpoint
// de webhook responde imediatamente (< 30s timeout Stripe) sem bloquear em queries BD.
const HANDLERS = {
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
};

export function iniciarWebhookWorker() {
  const worker = new Worker(
    'webhooks',
    async (job) => {
      const { tipo, evento } = job.data;
      const handler = HANDLERS[tipo];

      if (!handler) {
        logger.warn('Evento Stripe sem handler', { tipo });
        return;
      }

      logger.info('Processando evento Stripe', { tipo, eventoId: evento.id });
      await handler(evento);
    },
    {
      connection: redisFilas,
      concurrency: 3,
      // 3 tentativas com backoff exponencial antes de marcar como falhado.
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Webhook Stripe falhado', { jobId: job.id, erro: err.message });
  });

  return worker;
}
