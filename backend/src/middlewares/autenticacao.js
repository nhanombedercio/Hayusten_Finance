import jwt from 'jsonwebtoken';
import { db } from '../config/baseDados.js';
import { tenants } from '../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { erro } from '../utils/respostas.js';

const ESTADOS_BLOQUEADOS = ['suspenso', 'expirado', 'cancelado'];

// Verifica JWT e garante que o tenant está operacional antes de processar o pedido.
// O estado do tenant é verificado em cada pedido para bloquear acesso imediato após suspensão.
export async function autenticacao(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return erro(res, 'Token de autenticação em falta.', 401);
  }

  const token = cabecalho.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return erro(res, 'Token inválido ou expirado.', 401);
  }

  const [tenant] = await db
    .select({ id: tenants.id, estado: tenants.estado })
    .from(tenants)
    .where(eq(tenants.id, payload.tenantId))
    .limit(1);

  if (!tenant) {
    return erro(res, 'Conta não encontrada.', 401);
  }

  if (ESTADOS_BLOQUEADOS.includes(tenant.estado)) {
    const mensagens = {
      suspenso: 'A sua conta está suspensa. Regularize o pagamento para continuar.',
      expirado: 'O período experimental terminou. Subscreva um plano para continuar.',
      cancelado: 'A sua conta foi cancelada.',
    };
    return erro(res, mensagens[tenant.estado] || 'Acesso negado.', 403);
  }

  req.usuario = { id: payload.sub, tenantId: payload.tenantId, papel: payload.papel };
  next();
}
