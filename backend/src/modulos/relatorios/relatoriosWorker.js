import { Worker } from 'bullmq';
import { redisFilas } from '../../config/redis.js';
import { enviarRelatorioEmailServico } from './relatoriosServico.js';
import { logger } from '../../utils/logger.js';

// Worker dedicado a relatórios — separado dos outros workers porque a geração
// de PDF pode demorar vários segundos, não querendo bloquear emails ou webhooks.
export function iniciarRelatoriosWorker() {
  const worker = new Worker(
    'relatorios',
    async (job) => {
      const { tenantId, mes, ano } = job.data;
      logger.info('Gerando relatório mensal', { tenantId, mes, ano });
      await enviarRelatorioEmailServico(tenantId, mes, ano);
    },
    {
      connection: redisFilas,
      concurrency: 2,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
      },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Relatório falhado', { jobId: job.id, erro: err.message });
  });

  return worker;
}
