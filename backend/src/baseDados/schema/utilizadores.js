import { mysqlTable, varchar, boolean, datetime, mysqlEnum, uniqueIndex } from 'drizzle-orm/mysql-core';
import { tenants } from './tenants.js';

// Um tenant pode ter múltiplos utilizadores (proprietário + membros da família).
// O isolamento é garantido pelo tenantId em todas as queries.
export const utilizadores = mysqlTable(
  'utilizadores',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    tenantId: varchar('tenant_id', { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: varchar('nome', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    papel: mysqlEnum('papel', ['proprietario', 'membro']).default('membro').notNull(),
    activo: boolean('activo').default(true).notNull(),
    criadoEm: datetime('criado_em').default(new Date()).notNull(),
    actualizadoEm: datetime('actualizado_em').default(new Date()).notNull(),
  },
  (tabela) => ({
    // Índice único garante que o mesmo email não existe duas vezes no mesmo tenant.
    emailTenantUnico: uniqueIndex('email_tenant_unico').on(tabela.tenantId, tabela.email),
  })
);
