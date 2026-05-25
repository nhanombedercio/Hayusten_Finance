import { mysqlTable, varchar, datetime, mysqlEnum, decimal, json, date } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';

// Registo imutável de cada tentativa de pagamento — nunca eliminar.
// Serve de audit trail para suporte, disputas e relatórios financeiros internos.
export const pagamentos = mysqlTable('pagamentos', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'restrict' }),
  metodo: mysqlEnum('metodo', ['stripe', 'mpesa', 'emola']).notNull(),
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  moeda: varchar('moeda', { length: 3 }).default('MZN').notNull(),
  estado: mysqlEnum('estado', ['pendente', 'confirmado', 'falhado', 'reembolsado'])
    .default('pendente')
    .notNull(),
  // ID externo do gateway de pagamento — permite reconciliar com o extracto do Stripe/M-Pesa.
  referencia: varchar('referencia', { length: 255 }),
  plano: mysqlEnum('plano', ['premium']).notNull(),
  periodoInicio: date('periodo_inicio'),
  periodoFim: date('periodo_fim'),
  // JSON para guardar payload completo do gateway sem alterar o schema principal.
  metadados: json('metadados'),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});
