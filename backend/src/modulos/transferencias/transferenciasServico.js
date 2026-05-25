import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { transferencias, contasFinanceiras } from '../../baseDados/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { ErroNaoEncontrado, ErroNegocio } from '../../utils/erros.js';
import { emTransacao } from '../../utils/transacao.js';

export async function listar(tenantId) {
  return db.select().from(transferencias)
    .where(eq(transferencias.tenantId, tenantId))
    .orderBy(transferencias.data);
}

export async function buscarPorId(tenantId, id) {
  const [transf] = await db.select().from(transferencias)
    .where(and(eq(transferencias.tenantId, tenantId), eq(transferencias.id, id)))
    .limit(1);
  if (!transf) throw new ErroNaoEncontrado('Transferência');
  return transf;
}

export async function criar(tenantId, dados) {
  const { contaOrigemId, contaDestinoId, valor, descricao, data } = dados;

  if (contaOrigemId === contaDestinoId) {
    throw new ErroNegocio('A conta de origem e destino não podem ser a mesma.');
  }

  await validarConta(tenantId, contaOrigemId);
  await validarConta(tenantId, contaDestinoId);

  const id = uuidv4();

  // Toda a operação de transferência é atómica — origem e destino falham ou têm sucesso juntos.
  await emTransacao(async (tx) => {
    await tx.insert(transferencias).values({
      id, tenantId, contaOrigemId, contaDestinoId,
      valor: String(valor), descricao, data,
    });
  });

  return buscarPorId(tenantId, id);
}

export async function eliminar(tenantId, id) {
  await buscarPorId(tenantId, id);

  await emTransacao(async (tx) => {
    await tx.delete(transferencias)
      .where(and(eq(transferencias.tenantId, tenantId), eq(transferencias.id, id)));
  });
}

async function validarConta(tenantId, contaId) {
  const [conta] = await db.select({ id: contasFinanceiras.id, activa: contasFinanceiras.activa })
    .from(contasFinanceiras)
    .where(and(eq(contasFinanceiras.tenantId, tenantId), eq(contasFinanceiras.id, contaId)))
    .limit(1);
  if (!conta) throw new ErroNaoEncontrado('Conta financeira');
  if (!conta.activa) throw new ErroNegocio('Não é possível transferir de/para uma conta inactiva.');
}
