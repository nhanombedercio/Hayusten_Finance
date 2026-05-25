import { db } from '../../config/baseDados.js';
import { tenants, pagamentos } from '../../baseDados/schema/index.js';
import { eq } from 'drizzle-orm';
import { ErroNaoEncontrado } from '../../utils/erros.js';
import { cancelSubscription } from '../pagamentos/stripeServico.js';
import * as tenantsServico from '../tenants/tenantsServico.js';
import { enviarUpgradePlano, enviarDowngradePlano } from '../../utils/email.js';
import { emTransacao } from '../../utils/transacao.js';

export async function buscarEstado(tenantId) {
  const tenant = await tenantsServico.buscarTenant(tenantId);

  const [ultimoPagamento] = await db.select().from(pagamentos)
    .where(eq(pagamentos.tenantId, tenantId))
    .orderBy(pagamentos.criadoEm)
    .limit(1);

  return {
    plano: tenant.plano,
    estado: tenant.estado,
    assinaturaActiva: tenant.assinaturaActiva,
    trialInicio: tenant.trialInicio,
    trialFim: tenant.trialFim,
    proximaRenovacao: tenant.proximaRenovacao,
    ultimoPagamento: ultimoPagamento || null,
  };
}

export async function cancelar(tenantId) {
  const tenant = await tenantsServico.buscarTenant(tenantId);

  if (tenant.stripeSubscriptionId) {
    await cancelSubscription(tenant.stripeSubscriptionId);
  }

  await tenantsServico.cancelar(tenantId, tenant.proximaRenovacao);
}

export async function reactivar(tenantId) {
  await tenantsServico.reactivar(tenantId);
}

export async function alterarPlano(tenantId, novoPlano) {
  const tenant = await tenantsServico.buscarTenant(tenantId);
  const planoActual = tenant.plano;

  if (planoActual === novoPlano) return;

  await emTransacao(async (tx) => {
    await tx.update(tenants)
      .set({ plano: novoPlano, actualizadoEm: new Date() })
      .where(eq(tenants.id, tenantId));
  });

  // Downgrade ou upgrade — email diferente para cada caso.
  const planosOrdem = ['premium'];
  const actualIdx = planosOrdem.indexOf(planoActual);
  const novoIdx = planosOrdem.indexOf(novoPlano);

  if (novoIdx > actualIdx) {
    await enviarUpgradePlano(tenant.email, tenant.nome, novoPlano);
  } else {
    await enviarDowngradePlano(tenant.email, tenant.nome, novoPlano);
  }
}
