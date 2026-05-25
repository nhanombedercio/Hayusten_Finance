import { db } from '../../config/baseDados.js';
import { tenants, pagamentos } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { sucesso, erro } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';
import { randomUUID } from 'crypto';
import { emTransacao } from '../../utils/transacao.js';
import { enviarPagamentoConfirmado } from '../../utils/email.js';

// Valores por plano em MZN
const VALORES_PLANO = { premium: 99 };

// M-Pesa e Emola partilham o mesmo padrão de integração — apenas as credenciais diferem.
// Em produção, este serviço comunicaria com a API do gateway de pagamento local.
// Por ora, simula o fluxo de pagamento com estado inicial 'pendente'.
export async function iniciarMpesa(req, res, next) {
  try {
    await iniciarPagamentoMobile(req.tenant.id, req.body, 'mpesa', res);
  } catch (err) { next(err); }
}

export async function iniciarEmola(req, res, next) {
  try {
    await iniciarPagamentoMobile(req.tenant.id, req.body, 'emola', res);
  } catch (err) { next(err); }
}

async function iniciarPagamentoMobile(tenantId, dados, metodo, res) {
  const { plano, numero } = dados;
  const valor = VALORES_PLANO[plano];
  const referencia = randomUUID();
  const agora = new Date();

  // Regista o pagamento em estado 'pendente' enquanto aguarda confirmação do gateway
  await db.insert(pagamentos).values({
    id: randomUUID(),
    tenantId,
    metodo,
    valor,
    moeda: 'MZN',
    estado: 'pendente',
    referencia,
    plano,
    criadoEm: agora,
    actualizadoEm: agora,
    metadados: { numero },
  });

  // TODO: Chamar API M-Pesa/Emola real e esperar confirmação USSD do utilizador
  // Por ora retorna a referência para o cliente fazer polling ou aguardar callback

  logger.info('Pagamento mobile iniciado', { tenantId, metodo, plano, referencia });
  sucesso(res, {
    referencia,
    instrucoes: `Irá receber um pedido de confirmação no número ${numero}. Confirme para completar o pagamento.`,
    pendente: true,
  }, 'Pedido de pagamento enviado. Aguarde confirmação no seu telemóvel.');
}

// Callback do gateway M-Pesa — chamado quando o utilizador confirma no telemóvel
export async function callbackMpesa(req, res) {
  await processarCallback(req.body, 'mpesa');
  res.status(200).json({ sucesso: true });
}

export async function callbackEmola(req, res) {
  await processarCallback(req.body, 'emola');
  res.status(200).json({ sucesso: true });
}

async function processarCallback(payload, metodo) {
  try {
    const { referencia, sucesso: pagamentoSucesso, transactionId } = payload;
    if (!referencia) return;

    const [pagamento] = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.referencia, referencia))
      .limit(1);

    if (!pagamento || pagamento.estado !== 'pendente') return;

    const novoEstado = pagamentoSucesso ? 'confirmado' : 'falhado';
    const agora = new Date();

    await emTransacao(async (tx) => {
      await tx.update(pagamentos)
        .set({ estado: novoEstado, metadados: { ...pagamento.metadados, transactionId }, actualizadoEm: agora })
        .where(eq(pagamentos.referencia, referencia));

      if (pagamentoSucesso) {
        // Activa o tenant e define próxima renovação
        const proximaRenovacao = new Date(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
        await tx.update(tenants)
          .set({ estado: 'activo', assinaturaActiva: true, proximaRenovacao, actualizadoEm: agora })
          .where(eq(tenants.id, pagamento.tenantId));
      }
    });

    if (pagamentoSucesso) {
      const [tenant] = await db
        .select({ email: tenants.email, nome: tenants.nome, proximaRenovacao: tenants.proximaRenovacao })
        .from(tenants)
        .where(eq(tenants.id, pagamento.tenantId))
        .limit(1);

      if (tenant) {
        await enviarPagamentoConfirmado(
          tenant.email,
          tenant.nome,
          pagamento.valor,
          pagamento.moeda,
          tenant.proximaRenovacao?.toISOString().split('T')[0] ?? ''
        ).catch((e) => logger.error('Falha ao enviar email confirmação pagamento', { erro: e.message }));
      }
    }

    logger.info('Callback pagamento processado', { referencia, metodo, estado: novoEstado });
  } catch (err) {
    logger.error('Falha ao processar callback de pagamento', { metodo, erro: err.message });
  }
}
