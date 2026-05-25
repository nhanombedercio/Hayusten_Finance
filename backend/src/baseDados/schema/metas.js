import { mysqlTable, varchar, datetime, mysqlEnum, decimal, text, date } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';

// Metas de poupança — o utilizador define um objectivo e vai contribuindo.
export const metas = mysqlTable('metas', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 255 }).notNull(),
  valorObjectivo: decimal('valor_objectivo', { precision: 15, scale: 2 }).notNull(),
  // valorActual é actualizado automaticamente com cada contribuição para evitar
  // somar todas as contribuições em cada leitura.
  valorActual: decimal('valor_actual', { precision: 15, scale: 2 }).default('0').notNull(),
  dataLimite: date('data_limite'),
  estado: mysqlEnum('estado', ['activa', 'concluida', 'cancelada']).default('activa').notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
});

// Cada contribuição é um registo imutável que pode ser consultado separadamente.
export const contribuicoesMetas = mysqlTable('contribuicoes_metas', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  metaId: varchar('meta_id', { length: 36 })
    .notNull()
    .references(() => metas.id, { onDelete: 'cascade' }),
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  descricao: text('descricao'),
  data: date('data').notNull(),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
});
