import { mysqlTable, varchar, boolean, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';

// Categorias são criadas por tenant (personalizáveis) e algumas são marcadas como
// 'padrao' para distinguir as criadas no registo das criadas pelo utilizador.
export const categorias = mysqlTable('categorias', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 255 }).notNull(),
  tipo: mysqlEnum('tipo', ['receita', 'despesa']).notNull(),
  // Cor em hex para representação visual no dashboard.
  cor: varchar('cor', { length: 7 }).default('#6366f1').notNull(),
  // Nome do ícone (biblioteca de ícones do frontend, ex: Lucide).
  icone: varchar('icone', { length: 50 }).default('tag').notNull(),
  // Categorias padrão não podem ser eliminadas pelo utilizador.
  padrao: boolean('padrao').default(false).notNull(),
  activa: boolean('activa').default(true).notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});
