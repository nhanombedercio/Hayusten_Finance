import { mysqlTable, varchar, datetime, decimal, text, date } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';
import { contasFinanceiras } from './contasFinanceiras.js';

// Transferências entre contas do mesmo tenant.
// São registadas nesta tabela separada (não em transacoes) para evitar que
// o total de receitas/despesas fique inflacionado com movimentos internos.
export const transferencias = mysqlTable('transferencias', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  contaOrigemId: varchar('conta_origem_id', { length: 36 })
    .notNull()
    .references(() => contasFinanceiras.id, { onDelete: 'restrict' }),
  contaDestinoId: varchar('conta_destino_id', { length: 36 })
    .notNull()
    .references(() => contasFinanceiras.id, { onDelete: 'restrict' }),
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  descricao: text('descricao'),
  data: date('data').notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});
