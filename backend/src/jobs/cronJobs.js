import cron from 'node-cron';
import { addDays, differenceInDays } from 'date-fns';
import { db } from '../config/baseDados.js';
import { tenants } from '../baseDados/schema/index.js';
import { eq, and, lte, sql } from 'drizzle-orm';
import { filaRelatorios, filaInsights } from '../config/filas.js';
import { logger } from '../utils/logger.js';
import {
  enviarAvisoTrialExpira3Dias,
  enviarAvisoTrialExpira1Dia,
  enviarTrialExpirado,
  enviarAvisoRenovacao,
} from '../utils/email.js';

// Verifica trials diariamente às 07h00 UTC (09h00 Moçambique UTC+2).
function agendarVerificacaoTrials() {
  cron.schedule('0 7 * * *', async () => {
    logger.info('Cron: verificação de trials iniciada');
    const agora = new Date();

    const trialsActivos = await db.select()
      .from(tenants)
      .where(and(eq(tenants.estado, 'trial'), sql`trial_fim >= ${agora}`));

    for (const tenant of trialsActivos) {
      const diasRestantes = differenceInDays(new Date(tenant.trialFim), agora);

      if (diasRestantes === 3) {
        await enviarAvisoTrialExpira3Dias(tenant.email, tenant.nome, 3);
      } else if (diasRestantes === 1) {
        await enviarAvisoTrialExpira1Dia(tenant.email, tenant.nome);
      }
    }

    // Marcar como expirado os trials que já passaram.
    const expirados = await db.select()
      .from(tenants)
      .where(and(eq(tenants.estado, 'trial'), lte(tenants.trialFim, agora)));

    for (const tenant of expirados) {
      await db.update(tenants)
        .set({ estado: 'expirado', assinaturaActiva: false, actualizadoEm: new Date() })
        .where(eq(tenants.id, tenant.id));
      await enviarTrialExpirado(tenant.email, tenant.nome);
    }

    logger.info('Cron: verificação de trials concluída', { trialsActivos: trialsActivos.length, expirados: expirados.length });
  }, { timezone: 'Africa/Maputo' });
}

// Verifica renovações 3 dias antes para avisar o utilizador.
function agendarVerificacaoRenovacoes() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('Cron: verificação de renovações iniciada');
    const daqui3Dias = addDays(new Date(), 3);

    const aRenovar = await db.select()
      .from(tenants)
      .where(and(
        eq(tenants.assinaturaActiva, true),
        sql`DATE(proxima_renovacao) = DATE(${daqui3Dias})`
      ));

    for (const tenant of aRenovar) {
      await enviarAvisoRenovacao(
        tenant.email,
        tenant.nome,
        'Consulte a sua área de assinatura',
        new Date(tenant.proximaRenovacao).toLocaleDateString('pt-PT')
      );
    }

    logger.info('Cron: avisos de renovação enviados', { total: aRenovar.length });
  }, { timezone: 'Africa/Maputo' });
}

// Relatórios mensais — dia 1 de cada mês às 08h00 Moçambique.
function agendarRelatoriosMensais() {
  cron.schedule('0 8 1 * *', async () => {
    logger.info('Cron: envio de relatórios mensais iniciado');
    const agora = new Date();
    const mesAnterior = agora.getMonth() === 0 ? 12 : agora.getMonth();
    const anoAnterior = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();

    const tenantsActivos = await db.select({ id: tenants.id })
      .from(tenants)
      .where(and(
        sql`estado IN ('activo', 'trial')`,
        eq(tenants.relatoriosEmailActivo, true)
      ));

    for (const tenant of tenantsActivos) {
      await filaRelatorios.add('relatorio-mensal', {
        tenantId: tenant.id,
        mes: mesAnterior,
        ano: anoAnterior,
      }, { attempts: 2 });
    }

    logger.info('Cron: relatórios agendados', { total: tenantsActivos.length });
  }, { timezone: 'Africa/Maputo' });
}

// Insights gerados diariamente para todos os tenants activos.
// Gerado à meia-noite para estar pronto quando o utilizador aceder de manhã.
function agendarInsightsDiarios() {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Cron: geração de insights iniciada');

    const tenantsActivos = await db.select({ id: tenants.id })
      .from(tenants)
      .where(sql`estado IN ('activo', 'trial')`);

    for (const tenant of tenantsActivos) {
      await filaInsights.add('gerar-insights', { tenantId: tenant.id }, { attempts: 1 });
    }

    logger.info('Cron: insights agendados', { total: tenantsActivos.length });
  }, { timezone: 'Africa/Maputo' });
}

export function iniciarCronJobs() {
  agendarVerificacaoTrials();
  agendarVerificacaoRenovacoes();
  agendarRelatoriosMensais();
  agendarInsightsDiarios();
  logger.info('Cron jobs iniciados.');
}
