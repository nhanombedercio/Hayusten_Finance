import { db } from '../../config/baseDados.js';
import { transacoes, contasFinanceiras, categorias, metas, insights } from '../../baseDados/schema/index.js';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { calcularSaldo } from '../contasFinanceiras/contasServico.js';

export async function buscarDados(tenantId, { periodo, contaId, dataInicio, dataFim } = {}) {
  const { inicio, fim } = resolverPeriodo(periodo, dataInicio, dataFim);

  const [resumo, ultimasTransacoes, gastosCat, contasList, metasActivas, insightsRecentes] =
    await Promise.all([
      buscarResumo(tenantId, contaId, inicio, fim),
      buscarUltimasTransacoes(tenantId, contaId),
      buscarGastosPorCategoria(tenantId, contaId, inicio, fim),
      buscarResumoContas(tenantId),
      buscarMetasActivas(tenantId),
      buscarInsightsRecentes(tenantId),
    ]);

  const evolucao = await buscarEvolucaoSaldo(tenantId, contaId, inicio, fim);

  return {
    periodo: { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) },
    saldoTotal: contasList.reduce((s, c) => s + (c.saldoActual || 0), 0),
    totalReceitas: Number(resumo.receitas || 0),
    totalDespesas: Number(resumo.despesas || 0),
    poupanca: Number(resumo.receitas || 0) - Number(resumo.despesas || 0),
    ultimasTransacoes,
    gastosPorCategoria: gastosCat,
    evolucaoSaldo: evolucao,
    resumoContas: contasList,
    metasActivas,
    insightsRecentes,
  };
}

function resolverPeriodo(periodo, dataInicio, dataFim) {
  if (dataInicio && dataFim) {
    return { inicio: new Date(dataInicio), fim: new Date(dataFim) };
  }
  const fim = new Date();
  const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);
  if (periodo === '3m') inicio.setMonth(inicio.getMonth() - 2);
  if (periodo === '12m') inicio.setFullYear(inicio.getFullYear() - 1);
  return { inicio, fim };
}

async function buscarResumo(tenantId, contaId, inicio, fim) {
  const conds = [
    eq(transacoes.tenantId, tenantId),
    gte(transacoes.data, inicio.toISOString().slice(0, 10)),
    lte(transacoes.data, fim.toISOString().slice(0, 10)),
  ];
  if (contaId) conds.push(eq(transacoes.contaId, contaId));

  const [res] = await db.select({
    receitas: sql`COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0)`,
    despesas: sql`COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0)`,
  }).from(transacoes).where(and(...conds));
  return res;
}

async function buscarUltimasTransacoes(tenantId, contaId) {
  const conds = [eq(transacoes.tenantId, tenantId)];
  if (contaId) conds.push(eq(transacoes.contaId, contaId));

  return db.select({
    id: transacoes.id,
    tipo: transacoes.tipo,
    valor: transacoes.valor,
    descricao: transacoes.descricao,
    data: transacoes.data,
    categoriaNome: categorias.nome,
    categoriaCor: categorias.cor,
  }).from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .where(and(...conds))
    .orderBy(desc(transacoes.data), desc(transacoes.criadoEm))
    .limit(5);
}

async function buscarGastosPorCategoria(tenantId, contaId, inicio, fim) {
  const conds = [
    eq(transacoes.tenantId, tenantId),
    eq(transacoes.tipo, 'despesa'),
    gte(transacoes.data, inicio.toISOString().slice(0, 10)),
    lte(transacoes.data, fim.toISOString().slice(0, 10)),
  ];
  if (contaId) conds.push(eq(transacoes.contaId, contaId));

  return db.select({
    categoriaId: transacoes.categoriaId,
    nome: categorias.nome,
    cor: categorias.cor,
    total: sql`SUM(${transacoes.valor})`,
  }).from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .where(and(...conds))
    .groupBy(transacoes.categoriaId, categorias.nome, categorias.cor)
    .orderBy(sql`SUM(${transacoes.valor}) DESC`);
}

async function buscarResumoContas(tenantId) {
  const contas = await db.select()
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.activa, true)))
    .orderBy(contasFinanceiras.ordem);

  return Promise.all(contas.map(async (c) => ({
    id: c.id, nome: c.nome, tipo: c.tipo, moeda: c.moeda,
    saldoActual: await calcularSaldo(tenantId, c.id),
  })));
}

async function buscarMetasActivas(tenantId) {
  const lista = await db.select().from(metas)
    .where(and(eq(metas.tenantId, tenantId), eq(metas.estado, 'activa')))
    .orderBy(metas.dataLimite)
    .limit(5);

  return lista.map((m) => ({
    ...m,
    progresso: Number(m.valorObjectivo) > 0
      ? Math.min(100, Math.round((Number(m.valorActual) / Number(m.valorObjectivo)) * 100))
      : 0,
  }));
}

async function buscarInsightsRecentes(tenantId) {
  const agora = new Date();
  return db.select().from(insights)
    .where(and(
      eq(insights.tenantId, tenantId),
      sql`(${insights.expiraEm} IS NULL OR ${insights.expiraEm} > ${agora})`
    ))
    .orderBy(desc(insights.relevancia))
    .limit(3);
}

async function buscarEvolucaoSaldo(tenantId, contaId, inicio, fim) {
  const conds = [
    eq(transacoes.tenantId, tenantId),
    gte(transacoes.data, inicio.toISOString().slice(0, 10)),
    lte(transacoes.data, fim.toISOString().slice(0, 10)),
  ];
  if (contaId) conds.push(eq(transacoes.contaId, contaId));

  return db.select({
    data: sql`DATE_FORMAT(${transacoes.data}, '%Y-%m')`,
    receitas: sql`COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0)`,
    despesas: sql`COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0)`,
  }).from(transacoes)
    .where(and(...conds))
    .groupBy(sql`DATE_FORMAT(${transacoes.data}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${transacoes.data}, '%Y-%m')`);
}
