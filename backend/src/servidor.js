import 'dotenv/config';
import { validarAmbiente } from './config/ambiente.js';
import { verificarConexaoBD } from './config/baseDados.js';
import { verificarConexaoRedis } from './config/redis.js';
import app from './app.js';
import { iniciarWebhookWorker } from './modulos/pagamentos/workers/webhookWorker.js';
import { iniciarCronJobs } from './jobs/cronJobs.js';
import { logger } from './utils/logger.js';

// Validação de ambiente antes de qualquer inicialização.
// Se uma variável obrigatória estiver em falta, o processo termina com erro claro.
validarAmbiente();

const PORTA = Number(process.env.PORT) || 3000;

async function arrancar() {
  try {
    // Verifica conexões antes de abrir o servidor ao tráfego
    await verificarConexaoBD();
    logger.info('Base de dados conectada');

    await verificarConexaoRedis();
    logger.info('Redis conectado');

    // Inicia worker BullMQ para processamento de webhooks Stripe
    iniciarWebhookWorker();

    // Inicia cron jobs (relatórios, avisos trial, insights)
    iniciarCronJobs();

    app.listen(PORTA, () => {
      logger.info(`Servidor Hayusten Finance a correr na porta ${PORTA}`, {
        ambiente: process.env.NODE_ENV,
        porta: PORTA,
      });
    });
  } catch (erro) {
    logger.error('Falha ao arrancar o servidor', { erro: erro.message, stack: erro.stack });
    process.exit(1);
  }
}

// Graceful shutdown — fecha conexões antes de terminar o processo
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido — a encerrar graciosamente');
  process.exit(0);
});

process.on('uncaughtException', (erro) => {
  logger.error('Excepção não capturada', { erro: erro.message, stack: erro.stack });
  process.exit(1);
});

arrancar();
