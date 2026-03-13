import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile / expo-sqlite) ──────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  structureId: text('structure_id').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'idel', 'doctor'] }).notNull().default('idel'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ── PostgreSQL (serveur / Next.js) ─────────────────────────────────────────
export const usersPg = pgTable('users', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  structureId: pgText('structure_id').notNull(),
  email: pgText('email').notNull().unique(),
  role: pgText('role', { enum: ['admin', 'idel', 'doctor'] }).notNull().default('idel'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
