import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { pagamentos, tenants } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { ErroIntegracao, ErroNaoEncontrado } from '../../utils/erros.js';
import { logger } from '../../utils/logger.js';
import { enviarPagamentoConfirmado } from '../../utils/email.js';
import { emTransacao } from '../../utils/transacao.js';

const BASE_URL = process.env.MPESA_BASE_URL || 'https://api.sandbox.vm.co.mz';

// Obtém token de acesso M-Pesa via API Key + chave pública encriptada.
async function obterTokenMpesa() {
  const credenciais = Buffer.from(`${process.env.MPESA_API_KEY}`).toString('base64');
  const res = await fetch(`${BASE_URL}/ipg/v1x/getSession/`, {
    headers: {
      Authorization: `Basic ${credenciais}`,
      Origin: process.env.API_URL,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new ErroIntegracao('M-Pesa', 'Falha ao obter token M-Pesa.');
  const data = await res.json();
  return data.output_SessionID;
}

export async function iniciarPagamento(tenantId, { msisdn, valor, descricao }) {
  const pagamentoId = uuidv4();

  await db.insert(pagamentos).values({
    id: pagamentoId,
    tenantId,
    metodo: 'mpesa',
    valor: String(valor),
    moeda: 'MZN',
    estado: 'pendente',
    plano: 'premium',
    metadados: { msisdn, descricao },
  });

  try {
    const token = await obterTokenMpesa();

    const payload = {
      input_TransactionReference: pagamentoId,
      input_CustomerMSISDN: msisdn,
      input_Amount: String(valor),
      input_ThirdPartyReference: pagamentoId,
      input_ServiceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE,
      input_PurchasedItemsDesc: descricao || 'Assinatura Hayusten Finance',
    };

    const res = await fetch(`${BASE_URL}/ipg/v1x/c2bPayment/singleStage/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.API_URL,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const erroData = await res.json();
      throw new ErroIntegracao('M-Pesa', erroData.output_error || 'Falha no pedido M-Pesa.', erroData);
    }

    const data = await res.json();
    await db.update(pagamentos)
      .set({ referencia: data.output_ConversationID, metadados: { ...payload, resposta: data } })
      .where(eq(pagamentos.id, pagamentoId));

    return { pagamentoId, conversationId: data.output_ConversationID, estado: 'pendente' };
  } catch (err) {
    await db.update(pagamentos).set({ estado: 'falhado' }).where(eq(pagamentos.id, pagamentoId));
    throw err;
  }
}

// Callback chamado pela M-Pesa após confirmação do utilizador.
export async function processarCallback(payload) {
  const { input_ThirdPartyReference: pagamentoId, input_TransactionStatus: estado } = payload;

  const [pagamento] = await db.select().from(pagamentos).where(eq(pagamentos.id, pagamentoId)).limit(1);
  if (!pagamento) {
    logger.warn('Callback M-Pesa para pagamento desconhecido', { pagamentoId });
    return;
  }

  if (estado === 'Completed') {
    await emTransacao(async (tx) => {
      await tx.update(pagamentos)
        .set({ estado: 'confirmado', actualizadoEm: new Date() })
        .where(eq(pagamentos.id, pagamentoId));

      await tx.update(tenants)
        .set({ estado: 'activo', assinaturaActiva: true, actualizadoEm: new Date() })
        .where(eq(tenants.id, pagamento.tenantId));
    });

    const [tenant] = await db.select({ email: tenants.email, nome: tenants.nome })
      .from(tenants).where(eq(tenants.id, pagamento.tenantId)).limit(1);

    if (tenant) {
      await enviarPagamentoConfirmado(
        tenant.email, tenant.nome,
        `${Number(pagamento.valor).toFixed(2)} MZN`,
        'Próximo mês'
      );
    }
  } else {
    await db.update(pagamentos)
      .set({ estado: 'falhado', actualizadoEm: new Date() })
      .where(eq(pagamentos.id, pagamentoId));
  }
}
