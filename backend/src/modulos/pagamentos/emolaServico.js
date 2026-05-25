import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { pagamentos, tenants } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { ErroIntegracao } from '../../utils/erros.js';
import { logger } from '../../utils/logger.js';
import { enviarPagamentoConfirmado } from '../../utils/email.js';
import { emTransacao } from '../../utils/transacao.js';

const BASE_URL = process.env.EMOLA_BASE_URL || 'https://api.emola.co.mz';

// Obtém token de acesso Emola via API Key + Secret.
async function obterTokenEmola() {
  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: process.env.EMOLA_API_KEY,
      apiSecret: process.env.EMOLA_API_SECRET,
    }),
  });

  if (!res.ok) throw new ErroIntegracao('Emola', 'Falha ao obter token Emola.');
  const data = await res.json();
  return data.accessToken;
}

export async function iniciarPagamento(tenantId, { msisdn, valor, descricao }) {
  const pagamentoId = uuidv4();

  await db.insert(pagamentos).values({
    id: pagamentoId,
    tenantId,
    metodo: 'emola',
    valor: String(valor),
    moeda: 'MZN',
    estado: 'pendente',
    plano: 'premium',
    metadados: { msisdn, descricao },
  });

  try {
    const token = await obterTokenEmola();

    const payload = {
      merchantCode: process.env.EMOLA_MERCHANT_CODE,
      reference: pagamentoId,
      msisdn,
      amount: valor,
      currency: 'MZN',
      description: descricao || 'Assinatura Hayusten Finance',
      callbackUrl: process.env.EMOLA_CALLBACK_URL,
    };

    const res = await fetch(`${BASE_URL}/payments/c2b`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const erroData = await res.json();
      throw new ErroIntegracao('Emola', erroData.message || 'Falha no pedido Emola.', erroData);
    }

    const data = await res.json();
    await db.update(pagamentos)
      .set({ referencia: data.transactionId, metadados: { ...payload, resposta: data } })
      .where(eq(pagamentos.id, pagamentoId));

    return { pagamentoId, transactionId: data.transactionId, estado: 'pendente' };
  } catch (err) {
    await db.update(pagamentos).set({ estado: 'falhado' }).where(eq(pagamentos.id, pagamentoId));
    throw err;
  }
}

// Callback chamado pelo Emola após confirmação do pagamento.
export async function processarCallback(payload) {
  const { reference: pagamentoId, status, transactionId } = payload;

  const [pagamento] = await db.select().from(pagamentos).where(eq(pagamentos.id, pagamentoId)).limit(1);
  if (!pagamento) {
    logger.warn('Callback Emola para pagamento desconhecido', { pagamentoId });
    return;
  }

  if (status === 'SUCCESS') {
    await emTransacao(async (tx) => {
      await tx.update(pagamentos)
        .set({ estado: 'confirmado', referencia: transactionId, actualizadoEm: new Date() })
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
