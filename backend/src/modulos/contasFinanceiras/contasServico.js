import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { contasFinanceiras, transacoes, transferencias } from '../../baseDados/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { ErroNegocio, ErroNaoEncontrado } from '../../utils/erros.js';

export async function buscarTodas(tenantId) {
  const contas = await db
    .select()
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.activa, true)))
    .orderBy(contasFinanceiras.ordem);

  // Calcular saldo de cada conta de forma eficiente com uma query por conta.
  return Promise.all(contas.map(async (conta) => ({
    ...conta,
    saldoActual: await calcularSaldo(tenantId, conta.id),
  })));
}

export async function calcularSaldo(tenantId, contaId) {
  // Saldo = saldoInicial + soma(receitas) - soma(despesas) + transferências recebidas - transferências enviadas.
  const [resultado] = await db
    .select({
      receitas: sql`COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)`,
      despesas: sql`COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)`,
      saldoInicial: contasFinanceiras.saldoInicial,
    })
    .from(transacoes)
    .leftJoin(contasFinanceiras, eq(transacoes.contaId, contasFinanceiras.id))
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.contaId, contaId)));

  const [transf] = await db
    .select({
      recebido: sql`COALESCE(SUM(CASE WHEN conta_destino_id = ${contaId} THEN valor ELSE 0 END), 0)`,
      enviado: sql`COALESCE(SUM(CASE WHEN conta_origem_id = ${contaId} THEN valor ELSE 0 END), 0)`,
    })
    .from(transferencias)
    .where(eq(transferencias.tenantId, tenantId));

  const inicial = Number(resultado?.saldoInicial || 0);
  const receitas = Number(resultado?.receitas || 0);
  const despesas = Number(resultado?.despesas || 0);
  const recebido = Number(transf?.recebido || 0);
  const enviado = Number(transf?.enviado || 0);

  return Number((inicial + receitas - despesas + recebido - enviado).toFixed(2));
}

export async function buscarPorId(tenantId, id) {
  const [conta] = await db
    .select()
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.id, id)))
    .limit(1);

  if (!conta) throw new ErroNaoEncontrado('Conta financeira');
  return { ...conta, saldoActual: await calcularSaldo(tenantId, id) };
}

export async function criar(tenantId, dados) {
  const { nome, tipo, saldoInicial, moeda, ordem } = dados;

  const [existente] = await db
    .select({ id: contasFinanceiras.id })
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.nome, nome)))
    .limit(1);

  if (existente) throw new ErroNegocio('Já existe uma conta com este nome.', 409);

  const id = uuidv4();
  await db.insert(contasFinanceiras).values({
    id, tenantId, nome, tipo,
    saldoInicial: saldoInicial || 0,
    moeda: moeda || 'MZN',
    ordem: ordem || 0,
  });
  return buscarPorId(tenantId, id);
}

export async function editar(tenantId, id, dados) {
  await buscarPorId(tenantId, id);
  const { nome, tipo, saldoInicial, moeda, ordem, activa } = dados;
  await db.update(contasFinanceiras)
    .set({ nome, tipo, saldoInicial, moeda, ordem, activa, actualizadoEm: new Date() })
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.id, id)));
  return buscarPorId(tenantId, id);
}

export async function eliminar(tenantId, id) {
  const [temTransacoes] = await db
    .select({ total: sql`COUNT(*)` })
    .from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.contaId, id)));

  if (Number(temTransacoes?.total) > 0) {
    throw new ErroNegocio('Não é possível eliminar uma conta com transacções associadas. Arquive-a em vez disso.');
  }

  await db.update(contasFinanceiras)
    .set({ activa: false, actualizadoEm: new Date() })
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.id, id)));
}

export async function reordenar(tenantId, ordem) {
  // ordem = [{ id, ordem }] — actualiza a ordem de cada conta.
  await Promise.all(
    ordem.map(({ id, ordem: novaOrdem }) =>
      db.update(contasFinanceiras)
        .set({ ordem: novaOrdem, actualizadoEm: new Date() })
        .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.id, id)))
    )
  );
}
