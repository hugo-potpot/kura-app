import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const structures = sqliteTable('structures', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull(),
  address: text('address').notNull(),
  siret: text('siret').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const structuresPg = pgTable('structures', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  name: pgText('name').notNull(),
  address: pgText('address').notNull(),
  siret: pgText('siret').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
