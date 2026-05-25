import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisCache } from '../config/redis.js';

// Rate limiting por tenant (identificado pelo JWT) armazenado no Redis.
// Usar o tenant como chave em vez de IP evita que utilizadores legítimos por trás
// de um proxy partilhado (ex: rede empresarial) sejam bloqueados pelos outros.
function chave(req) {
  // Antes da autenticação (rota /auth) usa o IP; depois usa o tenantId.
  return req.usuario?.tenantId || req.ip;
}

const storeOpcoes = () => ({
  sendCommand: (...args) => redisCache.call(...args),
});

// 100 pedidos por minuto — suficiente para uso normal, bloqueia abusos de scraping.
export const limitadorGeral = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: chave,
  store: new RedisStore({ ...storeOpcoes(), prefix: 'rl:geral:' }),
  message: { sucesso: false, mensagem: 'Demasiados pedidos. Tente novamente em breve.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 10 pedidos por minuto nas rotas de autenticação — previne brute force.
export const limitadorAuth = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  store: new RedisStore({ ...storeOpcoes(), prefix: 'rl:auth:' }),
  message: { sucesso: false, mensagem: 'Demasiadas tentativas de autenticação. Aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 20 pedidos por hora para endpoints de IA — limita custos da API Anthropic.
export const limitadorIA = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: chave,
  store: new RedisStore({ ...storeOpcoes(), prefix: 'rl:ia:' }),
  message: { sucesso: false, mensagem: 'Limite de análises de IA atingido. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
