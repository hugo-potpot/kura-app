import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, integer as pgInteger, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const planningEntries = sqliteTable('planning_entries', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  patientId: text('patient_id').notNull(),
  idelId: text('idel_id').notNull(),
  date: text('date').notNull(),
  orderIndex: integer('order_index').notNull(),
  status: text('status', {
    enum: ['pending', 'in_progress', 'done', 'skipped'],
  }).notNull().default('pending'),
  etaMinutes: integer('eta_minutes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const planningEntriesPg = pgTable('planning_entries', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  patientId: pgText('patient_id').notNull(),
  idelId: pgText('idel_id').notNull(),
  date: pgText('date').notNull(),
  orderIndex: pgInteger('order_index').notNull(),
  status: pgText('status', {
    enum: ['pending', 'in_progress', 'done', 'skipped'],
  }).notNull().default('pending'),
  etaMinutes: pgInteger('eta_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
});
