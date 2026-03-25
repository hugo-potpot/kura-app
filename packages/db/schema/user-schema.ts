import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile / expo-sqlite) ──────────────────────────────────────────
// Note: côté serveur (PostgreSQL), la table user est gérée par BetterAuth (auth-schema.ts)
// avec les champs additionnels structureId + role.
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  structureId: text('structure_id').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'idel', 'doctor'] }).notNull().default('idel'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
