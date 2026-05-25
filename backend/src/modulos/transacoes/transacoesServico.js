import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { transacoes, contasFinanceiras, categorias } from '../../baseDados/schema/index.js';
import { eq, and, gte, lte, like, sql } from 'drizzle-orm';
import { ErroNaoEncontrado, ErroNegocio } from '../../utils/erros.js';

export async function listar(tenantId, filtros = {}) {
  const { dataInicio, dataFim, tipo, contaId, categoriaId, pesquisa, pagina = 1, limite = 20 } = filtros;

  const condicoes = [eq(transacoes.tenantId, tenantId)];
  if (dataInicio) condicoes.push(gte(transacoes.data, dataInicio));
  if (dataFim) condicoes.push(lte(transacoes.data, dataFim));
  if (tipo) condicoes.push(eq(transacoes.tipo, tipo));
  if (contaId) condicoes.push(eq(transacoes.contaId, contaId));
  if (categoriaId) condicoes.push(eq(transacoes.categoriaId, categoriaId));
  if (pesquisa) condicoes.push(like(transacoes.descricao, `%${pesquisa}%`));

  const offset = (Number(pagina) - 1) * Number(limite);

  const [{ total }] = await db
    .select({ total: sql`COUNT(*)` })
    .from(transacoes)
    .where(and(...condicoes));

  const dados = await db.select().from(transacoes)
    .where(and(...condicoes))
    .orderBy(sql`${transacoes.data} DESC, ${transacoes.criadoEm} DESC`)
    .limit(Number(limite))
    .offset(offset);

  return { dados, total: Number(total), pagina: Number(pagina), limite: Number(limite) };
}

export async function buscarPorId(tenantId, id) {
  const [transacao] = await db.select().from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.id, id)))
    .limit(1);
  if (!transacao) throw new ErroNaoEncontrado('Transacção');
  return transacao;
}

export async function criar(tenantId, utilizadorId, dados) {
  const { contaId, categoriaId, tipo, valor, descricao, data } = dados;

  await validarConta(tenantId, contaId);
  if (categoriaId) await validarCategoria(tenantId, categoriaId, tipo);

  const id = uuidv4();
  await db.insert(transacoes).values({
    id, tenantId, contaId, categoriaId, utilizadorId, tipo,
    valor: String(valor), descricao, data,
  });
  return buscarPorId(tenantId, id);
}

export async function editar(tenantId, id, dados) {
  const transacao = await buscarPorId(tenantId, id);
  const { contaId, categoriaId, tipo, valor, descricao, data } = dados;

  if (contaId) await validarConta(tenantId, contaId);
  const tipoFinal = tipo || transacao.tipo;
  if (categoriaId) await validarCategoria(tenantId, categoriaId, tipoFinal);

  await db.update(transacoes)
    .set({ contaId, categoriaId, tipo, valor: valor ? String(valor) : undefined, descricao, data, actualizadoEm: new Date() })
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.id, id)));

  return buscarPorId(tenantId, id);
}

export async function eliminar(tenantId, id) {
  await buscarPorId(tenantId, id);
  await db.delete(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.id, id)));
}

async function validarConta(tenantId, contaId) {
  const [conta] = await db.select({ id: contasFinanceiras.id, activa: contasFinanceiras.activa })
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.id, contaId)))
    .limit(1);
  if (!conta) throw new ErroNaoEncontrado('Conta financeira');
  if (!conta.activa) throw new ErroNegocio('Não é possível registar transacções numa conta inactiva.');
}

async function validarCategoria(tenantId, categoriaId, tipo) {
  const [cat] = await db.select({ tipo: categorias.tipo })
    .from(categorias)
    .where(and(eq(categorias.tenantId, tenantId), eq(categorias.id, categoriaId)))
    .limit(1);
  if (!cat) throw new ErroNaoEncontrado('Categoria');
  if (cat.tipo !== tipo) throw new ErroNegocio(`A categoria seleccionada é de ${cat.tipo}, mas a transacção é de ${tipo}.`);
}
