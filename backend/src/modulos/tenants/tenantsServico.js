import { db } from '../../config/baseDados.js';
import { tenants, utilizadores, transacoes, categorias, contasFinanceiras } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { ErroNaoEncontrado, ErroNegocio } from '../../utils/erros.js';
import { emTransacao } from '../../utils/transacao.js';
import { enviarContaSuspensa, enviarAssinaturaCancelada } from '../../utils/email.js';
import { logger } from '../../utils/logger.js';
import { redisSessoes } from '../../config/redis.js';

// Revoga todas as sessões activas do tenant — chamada obrigatória na suspensão
// para garantir que o utilizador não consegue continuar com sessões abertas.
async function revogarTodasSessoesTenant(tenantId) {
  const chaves = await redisSessoes.keys(`refresh:*`);
  // Filtramos os tokens que pertencem ao tenant através do valor armazenado.
  const pipeline = redisSessoes.pipeline();
  for (const chave of chaves) {
    pipeline.get(chave);
  }
  const valores = await pipeline.exec();
  const chavesDoTenant = chaves.filter((_, i) => {
    try {
      const dados = JSON.parse(valores[i][1]);
      return dados.tenantId === tenantId;
    } catch { return false; }
  });
  if (chavesDoTenant.length > 0) {
    await redisSessoes.del(...chavesDoTenant);
  }
  logger.info('Sessões revogadas', { tenantId, total: chavesDoTenant.length });
}

export async function buscarTenant(tenantId) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) throw new ErroNaoEncontrado('Tenant');
  return tenant;
}

export async function actualizarTenant(tenantId, dados) {
  await buscarTenant(tenantId);

  const campos = {};
  if (dados.nome !== undefined) campos.nome = dados.nome;
  if (dados.moedaPrincipal !== undefined) campos.moedaPrincipal = dados.moedaPrincipal;
  if (dados.relatoriosEmailActivo !== undefined) campos.relatoriosEmailActivo = dados.relatoriosEmailActivo;
  campos.actualizadoEm = new Date();

  await db.update(tenants).set(campos).where(eq(tenants.id, tenantId));
  return buscarTenant(tenantId);
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

  // Revoga sessões imediatamente — o utilizador é desligado em qualquer dispositivo activo.
  await revogarTodasSessoesTenant(tenantId);
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

// Eliminação RGPD — anonimiza os dados pessoais em vez de apagar o registo.
// Os registos financeiros são mantidos para integridade referencial e auditoria.
// Email e nome são substituídos por valores anónimos não identificáveis.
export async function eliminar(tenantId) {
  const tenant = await buscarTenant(tenantId);
  const ts = Date.now();
  const emailAnonimo = `anonimizado_eliminado_${ts}@hayusten.invalid`;
  const nomeAnonimo = 'Conta eliminada';

  await emTransacao(async (tx) => {
    // Anonimiza o tenant — mantém o registo para referência em pagamentos históricos.
    await tx.update(tenants)
      .set({ email: emailAnonimo, nome: nomeAnonimo, estado: 'cancelado', assinaturaActiva: false })
      .where(eq(tenants.id, tenantId));

    // Anonimiza todos os utilizadores do tenant.
    await tx.update(utilizadores)
      .set({ email: emailAnonimo, nome: nomeAnonimo, passwordHash: 'ELIMINADO', activo: false })
      .where(eq(utilizadores.tenantId, tenantId));
  });

  // Invalida todas as sessões activas após a anonimização.
  await revogarTodasSessoesTenant(tenantId);
  logger.info('Tenant anonimizado (RGPD)', { tenantId, emailOriginal: tenant.email });
}
