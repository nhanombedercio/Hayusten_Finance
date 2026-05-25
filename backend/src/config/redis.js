import Redis from 'ioredis';

// Usamos três instâncias Redis separadas por base de dados (DB 0, 1, 2).
// A separação evita que uma operação de flush ou prefixo colida com outra responsabilidade.
// Exemplo: um FLUSHDB na cache não elimina as sessões activas dos utilizadores.

const opcoesPadrao = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Reconecta automaticamente com backoff exponencial em caso de falha
  retryStrategy: (tentativas) => Math.min(tentativas * 100, 3000),
  lazyConnect: true,
};

// DB 0 — cache geral (dados que podem ser regenerados sem perda de dados)
export const redisCache = new Redis({ ...opcoesPadrao, db: Number(process.env.REDIS_DB_CACHE) || 0 });

// DB 1 — sessões e refresh tokens (dados sensíveis de autenticação)
export const redisSessoes = new Redis({ ...opcoesPadrao, db: Number(process.env.REDIS_DB_SESSOES) || 1 });

// DB 2 — filas BullMQ (jobs assíncronos de email, webhooks, relatórios)
// BullMQ requer uma instância dedicada para não interferir com os seus prefixos internos
export const redisFilas = new Redis({ ...opcoesPadrao, db: Number(process.env.REDIS_DB_FILAS) || 2 });

export async function verificarConexaoRedis() {
  await redisCache.connect();
  await redisSessoes.connect();
  await redisFilas.connect();
}
