import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { metas, contribuicoesMetas } from '../../baseDados/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { ErroNaoEncontrado, ErroNegocio } from '../../utils/erros.js';
import { emTransacao } from '../../utils/transacao.js';

export async function listar(tenantId) {
  return db.select().from(metas)
    .where(eq(metas.tenantId, tenantId))
    .orderBy(metas.criadoEm);
}

export async function buscarPorId(tenantId, id) {
  const [meta] = await db.select().from(metas)
    .where(and(eq(metas.tenantId, tenantId), eq(metas.id, id)))
    .limit(1);
  if (!meta) throw new ErroNaoEncontrado('Meta');
  return meta;
}

export async function criar(tenantId, dados) {
  const { nome, valorObjectivo, dataLimite } = dados;
  const id = uuidv4();
  await db.insert(metas).values({
    id, tenantId, nome, valorObjectivo: String(valorObjectivo), dataLimite,
  });
  return buscarPorId(tenantId, id);
}

export async function editar(tenantId, id, dados) {
  await buscarPorId(tenantId, id);
  const { nome, valorObjectivo, dataLimite, estado } = dados;
  await db.update(metas)
    .set({ nome, valorObjectivo: valorObjectivo ? String(valorObjectivo) : undefined, dataLimite, estado, actualizadoEm: new Date() })
    .where(and(eq(metas.tenantId, tenantId), eq(metas.id, id)));
  return buscarPorId(tenantId, id);
}

export async function eliminar(tenantId, id) {
  await buscarPorId(tenantId, id);
  await emTransacao(async (tx) => {
    await tx.delete(contribuicoesMetas).where(and(eq(contribuicoesMetas.tenantId, tenantId), eq(contribuicoesMetas.metaId, id)));
    await tx.delete(metas).where(and(eq(metas.tenantId, tenantId), eq(metas.id, id)));
  });
}

export async function adicionarContribuicao(tenantId, metaId, dados) {
  const meta = await buscarPorId(tenantId, metaId);
  if (meta.estado !== 'activa') throw new ErroNegocio('Só é possível contribuir para metas activas.');

  const { valor, descricao, data } = dados;
  const id = uuidv4();

  await emTransacao(async (tx) => {
    await tx.insert(contribuicoesMetas).values({
      id, tenantId, metaId, valor: String(valor), descricao, data,
    });

    const novoValor = Number(meta.valorActual) + Number(valor);
    const concluida = novoValor >= Number(meta.valorObjectivo);

    await tx.update(metas)
      .set({
        valorActual: String(novoValor),
        estado: concluida ? 'concluida' : 'activa',
        actualizadoEm: new Date(),
      })
      .where(and(eq(metas.tenantId, tenantId), eq(metas.id, metaId)));
  });

  return buscarPorId(tenantId, metaId);
}

export async function listarContribuicoes(tenantId, metaId) {
  await buscarPorId(tenantId, metaId);
  return db.select().from(contribuicoesMetas)
    .where(and(eq(contribuicoesMetas.tenantId, tenantId), eq(contribuicoesMetas.metaId, metaId)))
    .orderBy(contribuicoesMetas.data);
}

export async function eliminarContribuicao(tenantId, metaId, contribuicaoId) {
  const meta = await buscarPorId(tenantId, metaId);
  const [contribuicao] = await db.select().from(contribuicoesMetas)
    .where(and(eq(contribuicoesMetas.tenantId, tenantId), eq(contribuicoesMetas.id, contribuicaoId)))
    .limit(1);

  if (!contribuicao) throw new ErroNaoEncontrado('Contribuição');

  await emTransacao(async (tx) => {
    const novoValor = Math.max(0, Number(meta.valorActual) - Number(contribuicao.valor));
    await tx.delete(contribuicoesMetas)
      .where(and(eq(contribuicoesMetas.tenantId, tenantId), eq(contribuicoesMetas.id, contribuicaoId)));
    await tx.update(metas)
      .set({ valorActual: String(novoValor), actualizadoEm: new Date() })
      .where(and(eq(metas.tenantId, tenantId), eq(metas.id, metaId)));
  });
}
