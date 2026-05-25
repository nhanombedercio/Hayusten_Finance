import { db } from '../config/baseDados.js';

// Helper que garante rollback automático em qualquer falha dentro da transacção.
// Usar em qualquer operação com mais de uma escrita à base de dados — sem excepções.
// O Drizzle faz rollback automaticamente quando a função lançar, mas re-lançamos
// para que o erro suba normalmente para o handler global.
export async function emTransacao(fn) {
  return await db.transaction(async (tx) => {
    try {
      return await fn(tx);
    } catch (erro) {
      throw erro;
    }
  });
}
