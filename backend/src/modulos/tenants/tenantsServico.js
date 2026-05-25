import { db } from '../../config/baseDados.js';
import { tenants, utilizadores, transacoes, categorias, contasFinanceiras } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { ErroNaoEncontrado, ErroNegocio } from '../../utils/erros.js';
import { emTransacao } from '../../utils/transacao.js';
import { enviarContaSuspensa, enviarAssinaturaCancelada } from '../../utils/email.js';
import { logger } from '../../utils/logger.js';

export async function buscarTenant(tenantId) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) throw new ErroNaoEncontrado('Tenant');
  return tenant;
}

export async function activar(tenantId) {
  const tenant = await buscarTenant(tenantId);
  if (tenant.estado === 'activo') return tenant;

  await db.update(tenants)
    .set({ estado: 'activo', assinaturaActiva: true, actualizadoEm: new Date() })
    .where(eq(tenants.id, tenantId));

  logger.info('Tenant activado', { tenantId });
  return buscarTenant(tenantId);
}

export async function suspender(tenantId) {
  const tenant = await buscarTenant(tenantId);

  await db.update(tenants)
    .set({ estado: 'suspenso', assinaturaActiva: false, actualizadoEm: new Date() })
    .where(eq(tenants.id, tenantId));

  await enviarContaSuspensa(tenant.email, tenant.nome);
  logger.info('Tenant suspenso', { tenantId });
}

export async function reactivar(tenantId) {
  const tenant = await buscarTenant(tenantId);
  if (!['suspenso', 'expirado'].includes(tenant.estado)) {
    throw new ErroNegocio('Tenant não está suspenso ou expirado.');
  }

  await db.update(tenants)
    .set({ estado: 'activo', assinaturaActiva: true, actualizadoEm: new Date() })
    .where(eq(tenants.id, tenantId));

  logger.info('Tenant reactivado', { tenantId });
}

export async function cancelar(tenantId, dataFimAcesso) {
  const tenant = await buscarTenant(tenantId);

  await db.update(tenants)
    .set({ estado: 'cancelado', assinaturaActiva: false, actualizadoEm: new Date() })
    .where(eq(tenants.id, tenantId));

  const dataFim = dataFimAcesso
    ? new Date(dataFimAcesso).toLocaleDateString('pt-PT')
    : 'imediatamente';

  await enviarAssinaturaCancelada(tenant.email, tenant.nome, dataFim);
  logger.info('Tenant cancelado', { tenantId });
}

// Eliminação RGPD — apaga todos os dados pessoais do tenant.
// Usa CASCADE na BD mas é explícito aqui para auditoria.
export async function eliminar(tenantId) {
  await buscarTenant(tenantId);

  await emTransacao(async (tx) => {
    await tx.delete(transacoes).where(eq(transacoes.tenantId, tenantId));
    await tx.delete(categorias).where(eq(categorias.tenantId, tenantId));
    await tx.delete(contasFinanceiras).where(eq(contasFinanceiras.tenantId, tenantId));
    await tx.delete(utilizadores).where(eq(utilizadores.tenantId, tenantId));
    await tx.delete(tenants).where(eq(tenants.id, tenantId));
  });

  logger.info('Tenant eliminado (RGPD)', { tenantId });
}
