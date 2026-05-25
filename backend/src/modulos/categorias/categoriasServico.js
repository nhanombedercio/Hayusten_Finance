import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { categorias, transacoes } from '../../baseDados/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { ErroNegocio, ErroNaoEncontrado } from '../../utils/erros.js';

export async function listar(tenantId) {
  return db.select().from(categorias)
    .where(and(eq(categorias.tenantId, tenantId), eq(categorias.activa, true)))
    .orderBy(categorias.tipo, categorias.nome);
}

export async function buscarPorId(tenantId, id) {
  const [cat] = await db.select().from(categorias)
    .where(and(eq(categorias.tenantId, tenantId), eq(categorias.id, id)))
    .limit(1);
  if (!cat) throw new ErroNaoEncontrado('Categoria');
  return cat;
}

export async function criar(tenantId, dados) {
  const { nome, tipo, cor, icone } = dados;

  const [existente] = await db.select({ id: categorias.id }).from(categorias)
    .where(and(eq(categorias.tenantId, tenantId), eq(categorias.nome, nome), eq(categorias.tipo, tipo)))
    .limit(1);

  if (existente) throw new ErroNegocio('Já existe uma categoria com este nome e tipo.', 409);

  const id = uuidv4();
  await db.insert(categorias).values({ id, tenantId, nome, tipo, cor, icone, padrao: false });
  return buscarPorId(tenantId, id);
}

export async function editar(tenantId, id, dados) {
  await buscarPorId(tenantId, id);
  const { nome, cor, icone, activa } = dados;
  await db.update(categorias)
    .set({ nome, cor, icone, activa, actualizadoEm: new Date() })
    .where(and(eq(categorias.tenantId, tenantId), eq(categorias.id, id)));
  return buscarPorId(tenantId, id);
}

export async function eliminar(tenantId, id) {
  const categoria = await buscarPorId(tenantId, id);

  // Categorias padrão não podem ser eliminadas — fazem parte da estrutura base.
  if (categoria.padrao) throw new ErroNegocio('Não é possível eliminar categorias padrão do sistema.');

  const [temTransacoes] = await db
    .select({ total: sql`COUNT(*)` })
    .from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.categoriaId, id)));

  if (Number(temTransacoes?.total) > 0) {
    throw new ErroNegocio('Não é possível eliminar uma categoria com transacções associadas. Arquive-a em vez disso.');
  }

  await db.update(categorias)
    .set({ activa: false, actualizadoEm: new Date() })
    .where(and(eq(categorias.tenantId, tenantId), eq(categorias.id, id)));
}
