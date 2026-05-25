import 'dotenv/config';
import { validarAmbiente } from './config/ambiente.js';
import { verificarConexaoBD } from './config/baseDados.js';
import { verificarConexaoRedis } from './config/redis.js';
import app from './app.js';
import { iniciarWebhookWorker } from './modulos/pagamentos/workers/webhookWorker.js';
import { iniciarRelatoriosWorker } from './modulos/relatorios/relatoriosWorker.js';
import { iniciarCronJobs } from './jobs/cronJobs.js';
import { logger } from './utils/logger.js';
import { Worker } from 'bullmq';
import { redisFilas } from './config/redis.js';
import { gerarInsights } from './modulos/insights/insightsServico.js';

const PORTA = Number(process.env.PORT) || 3000;

async function iniciarInsightsWorker() {
  const worker = new Worker(
    'insights',
    async (job) => {
      const { tenantId } = job.data;
      await gerarInsights(tenantId);
    },
    { connection: redisFilas, concurrency: 5 }
  );
  worker.on('failed', (job, err) => logger.error('Insights worker falhado', { jobId: job?.id, erro: err.message }));
  return worker;
}

async function arrancar() {
  // Falhar cedo se o ambiente não estiver configurado correctamente.
  validarAmbiente();

  logger.info('A verificar conexões...');
  await verificarConexaoBD();
  logger.info('Base de dados OK.');

  await verificarConexaoRedis();
  logger.info('Redis OK.');

  // Workers BullMQ processam jobs assíncronos — separados do processo HTTP principal.
  iniciarWebhookWorker();
  iniciarRelatoriosWorker();
  await iniciarInsightsWorker();
  logger.info('Workers BullMQ iniciados.');

  iniciarCronJobs();

  const servidor = app.listen(PORTA, () => {
    logger.info(`Hayusten Finance API a correr na porta ${PORTA}`, {
      ambiente: process.env.NODE_ENV,
      porta: PORTA,
    });
  });

  // Graceful shutdown — espera pelos pedidos activos antes de encerrar.
  const terminar = (sinal) => {
    logger.info(`Sinal ${sinal} recebido. A encerrar graciosamente...`);
    servidor.close(() => {
      logger.info('Servidor HTTP encerrado.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => terminar('SIGTERM'));
  process.on('SIGINT', () => terminar('SIGINT'));
}

arrancar().catch((err) => {
  logger.error('Falha crítica no arranque', { erro: err.message, stack: err.stack });
  process.exit(1);
});
