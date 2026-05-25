import Anthropic from '@anthropic-ai/sdk';
import { db } from '../../config/baseDados.js';
import { transacoes, contasFinanceiras, categorias } from '../../baseDados/schema/index.js';
import { eq, and, gte, sql } from 'drizzle-orm';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODELO = process.env.ANTHROPIC_MODELO || 'claude-opus-4-5';

// Constrói contexto financeiro resumido para injectar no system prompt.
async function contextoResumo(tenantId) {
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - 3);

  const [resumo] = await db.select({
    receitas: sql`COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0)`,
    despesas: sql`COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0)`,
  }).from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), gte(transacoes.data, inicio.toISOString().slice(0, 10))));

  const gastos = await db.select({
    nome: categorias.nome,
    total: sql`SUM(${transacoes.valor})`,
  }).from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, 'despesa'), gte(transacoes.data, inicio.toISOString().slice(0, 10))))
    .groupBy(transacoes.categoriaId, categorias.nome)
    .orderBy(sql`SUM(${transacoes.valor}) DESC`)
    .limit(5);

  return `Dados financeiros dos últimos 3 meses:
- Receitas totais: ${resumo.receitas}
- Despesas totais: ${resumo.despesas}
- Poupança: ${(Number(resumo.receitas) - Number(resumo.despesas)).toFixed(2)}
- Top categorias de despesa: ${gastos.map((g) => `${g.nome}: ${g.total}`).join(', ')}`;
}

// Chat com contexto financeiro real do utilizador injectado no system prompt.
// O histórico permite conversas multi-turno sem perder contexto.
export async function enviarMensagem(tenantId, mensagem, historico = []) {
  const contexto = await contextoResumo(tenantId);

  const systemPrompt = `És um assistente financeiro pessoal da Hayusten Finance. Respondes sempre em português europeu, de forma clara e directa. Nunca inventas dados.

${contexto}

Ajuda o utilizador a compreender as suas finanças, dar conselhos práticos e responder a questões sobre os seus dados. Não forneças aconselhamento financeiro profissional — sugere sempre consultar um especialista para decisões importantes.`;

  const mensagens = [
    ...historico.map((h) => ({ role: h.papel, content: h.mensagem })),
    { role: 'user', content: mensagem },
  ];

  const resposta = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 1024,
    system: systemPrompt,
    messages: mensagens,
  });

  return {
    resposta: resposta.content[0].text,
    historico: [
      ...historico,
      { papel: 'user', mensagem },
      { papel: 'assistant', mensagem: resposta.content[0].text },
    ],
  };
}
