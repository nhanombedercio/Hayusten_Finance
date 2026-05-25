import { mysqlTable, varchar, boolean, datetime, mysqlEnum, decimal, int } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';

// Cada conta representa um instrumento financeiro real do utilizador.
// O saldo não é guardado directamente — é calculado a partir das transacções
// para evitar inconsistências entre o valor armazenado e os movimentos reais.
export const contasFinanceiras = mysqlTable('contas_financeiras', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 255 }).notNull(),
  tipo: mysqlEnum('tipo', ['banco', 'dinheiro', 'mobile_money']).notNull(),
  // Saldo inicial permite registar contas que já existiam antes de começar a usar a app.
  saldoInicial: decimal('saldo_inicial', { precision: 15, scale: 2 }).default('0').notNull(),
  moeda: mysqlEnum('moeda', ['MZN', 'USD']).default('MZN').notNull(),
  // Ordem para drag-and-drop no frontend.
  ordem: int('ordem').default(0).notNull(),
  activa: boolean('activa').default(true).notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});
