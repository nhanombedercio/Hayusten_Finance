import Anthropic from '@anthropic-ai/sdk';
import { db } from '../../config/baseDados.js';
import { transacoes, contasFinanceiras, categorias, metas } from '../../baseDados/schema/index.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { ErroNaoEncontrado } from '../../utils/erros.js';
import { logger } from '../../utils/logger.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODELO = process.env.ANTHROPIC_MODELO || 'claude-opus-4-5';

// Recolhe dados financeiros dos últimos N meses para contexto da IA.
async function recolherContextoFinanceiro(tenantId, mesesAtras = 3) {
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - mesesAtras);
  const inicioStr = inicio.toISOString().slice(0, 10);

  const [resumo] = await db.select({
    receitas: sql`COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0)`,
    despesas: sql`COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0)`,
    totalTransacoes: sql`COUNT(*)`,
  }).from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), gte(transacoes.data, inicioStr)));

  const gastosCat = await db.select({
    nome: categorias.nome,
    tipo: categorias.tipo,
    total: sql`SUM(${transacoes.valor})`,
  }).from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .where(and(eq(transacoes.tenantId, tenantId), gte(transacoes.data, inicioStr)))
    .groupBy(transacoes.categoriaId, categorias.nome, categorias.tipo)
    .orderBy(sql`SUM(${transacoes.valor}) DESC`)
    .limit(10);

  const contasList = await db.select({
    nome: contasFinanceiras.nome,
    tipo: contasFinanceiras.tipo,
    saldoInicial: contasFinanceiras.saldoInicial,
  }).from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.activa, true)));

  return { resumo, gastosCat, contasList, meses: mesesAtras };
}

export async function calcularScoreFinanceiro(tenantId) {
  const ctx = await recolherContextoFinanceiro(tenantId, 3);

  const prompt = `Analisa os dados financeiros seguintes dos últimos ${ctx.meses} meses e calcula um score de saúde financeira de 0 a 100.

Dados:
- Total receitas: ${ctx.resumo.receitas}
- Total despesas: ${ctx.resumo.despesas}
- Total transacções: ${ctx.resumo.totalTransacoes}
- Gastos por categoria: ${JSON.stringify(ctx.gastosCat)}

Responde APENAS com JSON no formato:
{"score": <número 0-100>, "classificacao": "<Fraco|Regular|Bom|Excelente>", "explicacao": "<2-3 frases em português europeu>", "pontosFortesEFracos": {"positivo": ["..."], "amelhora": ["..."]}}`;

  const msg = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    return JSON.parse(msg.content[0].text);
  } catch {
    logger.error('Falha a parsear score IA', { resposta: msg.content[0].text });
    return { score: 0, classificacao: 'Indisponível', explicacao: 'Não foi possível calcular o score neste momento.' };
  }
}

export async function gerarPrevisoesDespesas(tenantId) {
  const ctx = await recolherContextoFinanceiro(tenantId, 3);

  const prompt = `Com base nos dados financeiros dos últimos ${ctx.meses} meses, prevê as despesas do próximo mês por categoria.

Dados actuais por categoria: ${JSON.stringify(ctx.gastosCat)}
Total despesas: ${ctx.resumo.despesas}
Total receitas: ${ctx.resumo.receitas}

Responde APENAS com JSON:
{"previsoes": [{"categoria": "...", "valorPrevisto": <número>, "tendencia": "<aumento|estavel|reducao>", "confianca": <1-10>}], "totalPrevisto": <número>, "nota": "..."}`;

  const msg = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    return JSON.parse(msg.content[0].text);
  } catch {
    return { previsoes: [], totalPrevisto: 0, nota: 'Previsão indisponível.' };
  }
}

export async function calcularProjecaoSaldo(tenantId, meses = 6) {
  const ctx = await recolherContextoFinanceiro(tenantId, 3);
  const mediaReceitas = Number(ctx.resumo.receitas) / 3;
  const mediaDespesas = Number(ctx.resumo.despesas) / 3;

  const prompt = `Projecta o saldo para os próximos ${meses} meses com base nos dados históricos.

Média mensal receitas: ${mediaReceitas.toFixed(2)}
Média mensal despesas: ${mediaDespesas.toFixed(2)}
Contas actuais: ${JSON.stringify(ctx.contasList)}

Responde APENAS com JSON:
{"projecao": [{"mes": "AAAA-MM", "saldoEstimado": <número>, "cenarioPessimista": <número>, "cenarioOtimista": <número>}], "observacao": "..."}`;

  const msg = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    return JSON.parse(msg.content[0].text);
  } catch {
    return { projecao: [], observacao: 'Projecção indisponível.' };
  }
}

export async function simularCenario(tenantId, reducaoCategoria, percentagem) {
  const ctx = await recolherContextoFinanceiro(tenantId, 3);

  const prompt = `Simula o impacto de reduzir os gastos em "${reducaoCategoria}" em ${percentagem}%.

Dados actuais: ${JSON.stringify(ctx.gastosCat)}
Total receitas: ${ctx.resumo.receitas}
Total despesas: ${ctx.resumo.despesas}

Responde APENAS com JSON:
{"poupancaMensal": <número>, "poupancaAnual": <número>, "novoTotalDespesas": <número>, "novaMargem": <percentagem>, "analise": "..."}`;

  const msg = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    return JSON.parse(msg.content[0].text);
  } catch {
    return { poupancaMensal: 0, analise: 'Simulação indisponível.' };
  }
}

export async function calcularPoupancaMeta(tenantId, metaId) {
  const [meta] = await db.select().from(metas)
    .where(and(eq(metas.tenantId, tenantId), eq(metas.id, metaId)))
    .limit(1);

  if (!meta) throw new ErroNaoEncontrado('Meta');

  const ctx = await recolherContextoFinanceiro(tenantId, 3);
  const mediaReceitas = Number(ctx.resumo.receitas) / 3;
  const mediaDespesas = Number(ctx.resumo.despesas) / 3;
  const margemMensal = mediaReceitas - mediaDespesas;

  const prompt = `Cria um plano de poupança para a meta "${meta.nome}".

Meta: ${meta.nome}
Valor objectivo: ${meta.valorObjectivo}
Valor actual: ${meta.valorActual}
Data limite: ${meta.dataLimite || 'sem prazo'}
Margem mensal disponível: ${margemMensal.toFixed(2)}

Responde APENAS com JSON:
{"valorFalta": <número>, "mesesNecessarios": <número>, "poupancaMensalSugerida": <número>, "percentagemDaReceita": <número>, "viavel": <boolean>, "sugestoes": ["..."]}`;

  const msg = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    return JSON.parse(msg.content[0].text);
  } catch {
    return { viavel: false, sugestoes: ['Plano indisponível.'] };
  }
}
