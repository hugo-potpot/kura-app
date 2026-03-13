import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  ipAddress: text('ip_address'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata'),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const auditLogsPg = pgTable('audit_logs', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  userId: pgText('user_id').notNull(),
  action: pgText('action').notNull(),
  resourceType: pgText('resource_type').notNull(),
  resourceId: pgText('resource_id').notNull(),
  ipAddress: pgText('ip_address'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  metadata: pgText('metadata'),
});
