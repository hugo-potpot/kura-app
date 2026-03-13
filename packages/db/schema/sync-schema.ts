import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, integer as pgInteger, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  entityType: text('entity_type', {
    enum: ['patient', 'transmission', 'planning_entry'],
  }).notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation', { enum: ['CREATE', 'UPDATE', 'DELETE'] }).notNull(),
  payload: text('payload').notNull(),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const syncQueuePg = pgTable('sync_queue', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  entityType: pgText('entity_type', {
    enum: ['patient', 'transmission', 'planning_entry'],
  }).notNull(),
  entityId: pgText('entity_id').notNull(),
  operation: pgText('operation', { enum: ['CREATE', 'UPDATE', 'DELETE'] }).notNull(),
  payload: pgText('payload').notNull(),
  retryCount: pgInteger('retry_count').notNull().default(0),
  lastError: pgText('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
