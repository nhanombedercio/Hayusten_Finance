import { mysqlTable, varchar, datetime, mysqlEnum, decimal, text, date } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';
import { contasFinanceiras } from './contasFinanceiras.js';
import { categorias } from './categorias.js';
import { utilizadores } from './utilizadores.js';

// Transacções são o core do produto — cada movimento financeiro fica aqui.
// O campo tenantId é redundante (pode derivar da conta) mas está presente
// para garantir que todas as queries de isolamento sejam simples e directas.
export const transacoes = mysqlTable('transacoes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  contaId: varchar('conta_id', { length: 36 })
    .notNull()
    .references(() => contasFinanceiras.id, { onDelete: 'restrict' }),
  categoriaId: varchar('categoria_id', { length: 36 })
    .references(() => categorias.id, { onDelete: 'set null' }),
  utilizadorId: varchar('utilizador_id', { length: 36 })
    .references(() => utilizadores.id, { onDelete: 'set null' }),
  tipo: mysqlEnum('tipo', ['receita', 'despesa']).notNull(),
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  descricao: text('descricao'),
  // Separar data de criação de data de ocorrência — permite registar transacções retroactivas.
  data: date('data').notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});
