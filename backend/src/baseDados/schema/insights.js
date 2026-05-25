import { mysqlTable, varchar, datetime, boolean, int, text, json } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';

// Insights são gerados assíncronamente e têm validade — expiram quando
// o contexto muda (novo mês, novas transacções) para não mostrar dados antigos.
export const insights = mysqlTable('insights', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  // Tipo estruturado permite filtrar e agrupar insights no frontend.
  tipo: varchar('tipo', { length: 100 }).notNull(),
  mensagem: text('mensagem').notNull(),
  // Relevância 0-100 determina a ordem de apresentação — insights mais críticos primeiro.
  relevancia: int('relevancia').default(0).notNull(),
  lido: boolean('lido').default(false).notNull(),
  // Metadados JSON permitem guardar contexto adicional sem alterar o schema.
  metadados: json('metadados'),
  criadoEm: datetime('criado_em').default(new Date()).notNull(),
  expiraEm: datetime('expira_em'),
});
