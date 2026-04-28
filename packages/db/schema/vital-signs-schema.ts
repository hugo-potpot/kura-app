import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, real as pgReal, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile, offline-first) ─────────────────────────────────────────
export const vitalSigns = sqliteTable('vital_signs', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  patientId: text('patient_id').notNull(),
  authorId: text('author_id').notNull(),
  measuredAt: integer('measured_at', { mode: 'timestamp' }).notNull(),
  systolic: real('systolic'),
  diastolic: real('diastolic'),
  glycemia: real('glycemia'),
  weight: real('weight'),
  temperature: real('temperature'),
  spo2: real('spo2'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const vitalSignsPg = pgTable('vital_signs', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  patientId: pgText('patient_id').notNull(),
  authorId: pgText('author_id').notNull(),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
  systolic: pgReal('systolic'),
  diastolic: pgReal('diastolic'),
  glycemia: pgReal('glycemia'),
  weight: pgReal('weight'),
  temperature: pgReal('temperature'),
  spo2: pgReal('spo2'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
});
