import { db } from '../../config/baseDados.js';
import { tenants, pagamentos, utilizadores } from '../../baseDados/schema/index.js';
import { eq, like, sql, desc, and } from 'drizzle-orm';
import * as tenantsServico from '../tenants/tenantsServico.js';

export async function buscarMetricas() {
  const [contagens] = await db.select({
    total: sql`COUNT(*)`,
    activos: sql`SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END)`,
    trial: sql`SUM(CASE WHEN estado = 'trial' THEN 1 ELSE 0 END)`,
    suspensos: sql`SUM(CASE WHEN estado = 'suspenso' THEN 1 ELSE 0 END)`,
    cancelados: sql`SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END)`,
    comAssinatura: sql`SUM(CASE WHEN assinatura_activa = 1 THEN 1 ELSE 0 END)`,
  }).from(tenants);

  const [mrr] = await db.select({
    mrr: sql`COALESCE(SUM(valor), 0)`,
  }).from(pagamentos)
    .where(and(
      eq(pagamentos.estado, 'confirmado'),
      sql`MONTH(criado_em) = MONTH(CURDATE()) AND YEAR(criado_em) = YEAR(CURDATE())`
    ));

  const totalActivos = Number(contagens.activos || 0);
  const totalTrial = Number(contagens.trial || 0);
  const taxaConversao = totalTrial + totalActivos > 0
    ? ((totalActivos / (totalTrial + totalActivos)) * 100).toFixed(1)
    : 0;

  return {
    total: Number(contagens.total),
    totalActivos,
    totalTrials: totalTrial,
    totalSuspensos: Number(contagens.suspensos || 0),
    totalCancelados: Number(contagens.cancelados || 0),
    mrr: Number(mrr?.mrr || 0),
    taxaConversao: Number(taxaConversao),
    // Métricas do mês actual são calculadas com base nos pagamentos confirmados.
    novasSubscricoesMes: Number(contagens.comAssinatura || 0),
    cancelamentosMes: 0, // TODO: filtrar cancelamentos do mês actual
  };
}

export async function listarTenants({ pagina = 1, limite = 20, pesquisa, estado } = {}) {
  const conds = [];
  if (pesquisa) conds.push(like(tenants.email, `%${pesquisa}%`));
  if (estado) conds.push(eq(tenants.estado, estado));

  const offset = (Number(pagina) - 1) * Number(limite);

  const [{ total }] = await db.select({ total: sql`COUNT(*)` })
    .from(tenants)
    .where(conds.length ? and(...conds) : undefined);

  const dados = await db.select({
    id: tenants.id,
    nome: tenants.nome,
    email: tenants.email,
    estado: tenants.estado,
    plano: tenants.plano,
    assinaturaActiva: tenants.assinaturaActiva,
    criadoEm: tenants.criadoEm,
    trialFim: tenants.trialFim,
  }).from(tenants)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(tenants.criadoEm))
    .limit(Number(limite))
    .offset(offset);

  return { dados, total: Number(total), pagina: Number(pagina), limite: Number(limite) };
}

export async function buscarTenant(id) {
  const tenant = await tenantsServico.buscarTenant(id);

  // Inclui utilizadores e últimos 20 pagamentos para a página de detalhe.
  const usrs = await db
    .select({ id: utilizadores.id, nome: utilizadores.nome, email: utilizadores.email, papel: utilizadores.papel })
    .from(utilizadores)
    .where(eq(utilizadores.tenantId, id));

  const pgts = await db.select().from(pagamentos)
    .where(eq(pagamentos.tenantId, id))
    .orderBy(desc(pagamentos.criadoEm))
    .limit(20);

  return { ...tenant, utilizadores: usrs, pagamentos: pgts };
}

export async function suspenderTenant(id) {
  return tenantsServico.suspender(id);
}

export async function reactivarTenant(id) {
  return tenantsServico.reactivar(id);
}

export async function eliminarTenant(id) {
  return tenantsServico.eliminar(id);
}

export async function listarPagamentos({ pagina = 1, limite = 25, tenantId, metodo, estado } = {}) {
  const conds = [];
  if (tenantId) conds.push(eq(pagamentos.tenantId, tenantId));
  if (metodo) conds.push(eq(pagamentos.metodo, metodo));
  if (estado) conds.push(eq(pagamentos.estado, estado));

  const offset = (Number(pagina) - 1) * Number(limite);

  const [{ total }] = await db.select({ total: sql`COUNT(*)` })
    .from(pagamentos)
    .where(conds.length ? and(...conds) : undefined);

  const dados = await db.select().from(pagamentos)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(pagamentos.criadoEm))
    .limit(Number(limite))
    .offset(offset);

  return { dados, total: Number(total), pagina: Number(pagina), limite: Number(limite) };
}
