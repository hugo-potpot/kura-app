import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const transmissions = sqliteTable('transmissions', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  patientId: text('patient_id').notNull(),
  authorId: text('author_id').notNull(),
  contentOriginal: text('content_original'),
  contentValidated: text('content_validated').notNull(),
  careType: text('care_type', {
    enum: ['toilette', 'pansement', 'injection', 'constantes', 'autre'],
  }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const transmissionsPg = pgTable('transmissions', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  patientId: pgText('patient_id').notNull(),
  authorId: pgText('author_id').notNull(),
  contentOriginal: pgText('content_original'),
  contentValidated: pgText('content_validated').notNull(),
  careType: pgText('care_type', {
    enum: ['toilette', 'pansement', 'injection', 'constantes', 'autre'],
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
});
