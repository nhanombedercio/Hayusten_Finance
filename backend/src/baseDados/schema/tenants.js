import { mysqlTable, varchar, boolean, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';

// Tenant é a unidade de isolamento: cada conta pessoal/familiar é um tenant.
// Toda a query noutros schemas filtra por tenantId para garantir isolamento total.
export const tenants = mysqlTable('tenants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  moedaPrincipal: mysqlEnum('moeda_principal', ['MZN', 'USD']).default('MZN').notNull(),
  estado: mysqlEnum('estado', ['trial', 'activo', 'suspenso', 'expirado', 'cancelado'])
    .default('trial')
    .notNull(),
  plano: mysqlEnum('plano', ['premium']).default('premium').notNull(),
  trialInicio: datetime('trial_inicio').notNull(),
  trialFim: datetime('trial_fim').notNull(),
  assinaturaActiva: boolean('assinatura_activa').default(false).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  proximaRenovacao: datetime('proxima_renovacao'),
  emailConfirmado: boolean('email_confirmado').default(false).notNull(),
  // Token de vida curta — não precisa de índice porque é lookup pontual.
  tokenConfirmacaoEmail: varchar('token_confirmacao_email', { length: 255 }),
  tokenRecuperacaoPassword: varchar('token_recuperacao_password', { length: 255 }),
  tokenRecuperacaoExpira: datetime('token_recuperacao_expira'),
  relatoriosEmailActivo: boolean('relatorios_email_activo').default(true).notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});
