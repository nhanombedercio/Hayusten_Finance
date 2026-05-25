import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { db } from '../../config/baseDados.js';
import { insights, transacoes, contasFinanceiras, categorias } from '../../baseDados/schema/index.js';
import { eq, and, gte, sql, lte } from 'drizzle-orm';

// Insights expiram ao fim de 30 dias — são regenerados diariamente pelo cron.
const EXPIRACAO_DIAS = 30;

export async function listar(tenantId) {
  const agora = new Date();
  return db.select().from(insights)
    .where(and(
      eq(insights.tenantId, tenantId),
      sql`(${insights.expiraEm} IS NULL OR ${insights.expiraEm} > ${agora})`
    ))
    .orderBy(sql`${insights.relevancia} DESC, ${insights.criadoEm} DESC`);
}

export async function marcarLido(tenantId, id) {
  await db.update(insights)
    .set({ lido: true })
    .where(and(eq(insights.tenantId, tenantId), eq(insights.id, id)));
}

// Analisa dados dos últimos 3 meses e gera insights relevantes.
// Apaga os antigos primeiro para não acumular insights desactualizados.
export async function gerarInsights(tenantId) {
  const agora = new Date();
  const inicioMesActual = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);
  const inicio3Meses = new Date(agora.getFullYear(), agora.getMonth() - 3, 1);

  const novosInsights = [];

  await analisarGastosPorCategoria(tenantId, inicioMesActual, inicioMesAnterior, fimMesAnterior, novosInsights);
  await analisarMargem(tenantId, inicioMesActual, agora, novosInsights);
  await analisarSaldosBaixos(tenantId, novosInsights);
  await analisarTendencia3Meses(tenantId, inicio3Meses, agora, novosInsights);

  // Substituir insights antigos atomicamente para evitar período sem insights.
  await db.delete(insights).where(eq(insights.tenantId, tenantId));

  if (novosInsights.length > 0) {
    await db.insert(insights).values(
      novosInsights.map((i) => ({
        id: uuidv4(),
        tenantId,
        expiraEm: addDays(agora, EXPIRACAO_DIAS),
        ...i,
      }))
    );
  }
}

async function analisarGastosPorCategoria(tenantId, inicioActual, inicioAnterior, fimAnterior, resultado) {
  const [actualRows, anteriorRows] = await Promise.all([
    gastosPorCategoria(tenantId, inicioActual, new Date()),
    gastosPorCategoria(tenantId, inicioAnterior, fimAnterior),
  ]);

  const mapaAnterior = Object.fromEntries(anteriorRows.map((r) => [r.categoriaId, r.total]));

  for (const actual of actualRows) {
    const anterior = Number(mapaAnterior[actual.categoriaId] || 0);
    if (anterior === 0) continue;
    const variacao = ((actual.total - anterior) / anterior) * 100;

    if (variacao >= 30) {
      resultado.push({
        tipo: 'aumento_categoria',
        mensagem: `Os gastos em "${actual.nome}" aumentaram ${variacao.toFixed(0)}% em relação ao mês passado.`,
        relevancia: Math.min(100, Math.round(variacao)),
        metadados: { categoriaId: actual.categoriaId, variacao, actual: actual.total, anterior },
      });
    }
  }
}

async function analisarMargem(tenantId, inicio, fim, resultado) {
  const [res] = await db.select({
    receitas: sql`COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)`,
    despesas: sql`COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)`,
  }).from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), gte(transacoes.data, inicio.toISOString().slice(0, 10))));

  const receitas = Number(res?.receitas || 0);
  const despesas = Number(res?.despesas || 0);
  if (receitas === 0) return;

  const margem = ((receitas - despesas) / receitas) * 100;
  if (margem < 20) {
    resultado.push({
      tipo: 'margem_baixa',
      mensagem: `Este mês está a gastar ${(100 - margem).toFixed(0)}% das suas receitas. A margem de poupança é baixa.`,
      relevancia: Math.round(Math.max(0, 50 - margem)),
      metadados: { margem, receitas, despesas },
    });
  }
}

async function analisarSaldosBaixos(tenantId, resultado) {
  const contas = await db.select({ id: contasFinanceiras.id, nome: contasFinanceiras.nome, saldoInicial: contasFinanceiras.saldoInicial })
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.activa, true)));

  for (const conta of contas) {
    const [res] = await db.select({
      receitas: sql`COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)`,
      despesas: sql`COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)`,
    }).from(transacoes)
      .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.contaId, conta.id)));

    const saldo = Number(conta.saldoInicial) + Number(res?.receitas || 0) - Number(res?.despesas || 0);

    if (saldo < 0) {
      resultado.push({
        tipo: 'saldo_negativo',
        mensagem: `A conta "${conta.nome}" tem saldo negativo (${saldo.toFixed(2)}).`,
        relevancia: 90,
        metadados: { contaId: conta.id, saldo },
      });
    } else if (saldo < 500) {
      resultado.push({
        tipo: 'saldo_baixo',
        mensagem: `A conta "${conta.nome}" tem saldo baixo (${saldo.toFixed(2)}).`,
        relevancia: 60,
        metadados: { contaId: conta.id, saldo },
      });
    }
  }
}

async function analisarTendencia3Meses(tenantId, inicio, fim, resultado) {
  const meses = [0, 1, 2].map((i) => {
    const d = new Date(fim.getFullYear(), fim.getMonth() - i, 1);
    return { inicio: d, fim: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  });

  let mesesNegativos = 0;
  for (const { inicio: ini, fim: f } of meses) {
    const [res] = await db.select({
      receitas: sql`COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)`,
      despesas: sql`COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)`,
    }).from(transacoes)
      .where(and(
        eq(transacoes.tenantId, tenantId),
        gte(transacoes.data, ini.toISOString().slice(0, 10)),
        lte(transacoes.data, f.toISOString().slice(0, 10))
      ));

    if (Number(res?.despesas || 0) > Number(res?.receitas || 0)) mesesNegativos++;
  }

  if (mesesNegativos >= 2) {
    resultado.push({
      tipo: 'tendencia_negativa',
      mensagem: `Nos últimos ${mesesNegativos} meses as despesas superaram as receitas. Reveja o seu orçamento.`,
      relevancia: 85,
      metadados: { mesesNegativos },
    });
  }
}

async function gastosPorCategoria(tenantId, inicio, fim) {
  return db.select({
    categoriaId: transacoes.categoriaId,
    nome: categorias.nome,
    total: sql`SUM(${transacoes.valor})`,
  })
    .from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .where(and(
      eq(transacoes.tenantId, tenantId),
      eq(transacoes.tipo, 'despesa'),
      gte(transacoes.data, inicio.toISOString().slice(0, 10)),
      lte(transacoes.data, fim.toISOString().slice(0, 10))
    ))
    .groupBy(transacoes.categoriaId, categorias.nome);
}
