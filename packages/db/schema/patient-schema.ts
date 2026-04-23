import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, real as pgReal, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  structureId: text('structure_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  phone: text('phone'),
  treatingDoctor: text('treating_doctor'),
  assignedIdelId: text('assigned_idel_id'),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const patientsPg = pgTable('patients', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  structureId: pgText('structure_id').notNull(),
  firstName: pgText('first_name').notNull(),
  lastName: pgText('last_name').notNull(),
  address: pgText('address').notNull(),
  latitude: pgReal('latitude'),
  longitude: pgReal('longitude'),
  phone: pgText('phone'),
  treatingDoctor: pgText('treating_doctor'),
  assignedIdelId: pgText('assigned_idel_id'),
  status: pgText('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
});
