import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '@kura/shared';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ── SQLite (mobile) ─────────────────────────────────────────────────────────
export const structures = sqliteTable('structures', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull(),
  address: text('address').notNull(),
  siret: text('siret').unique(), // nullable — SIRET optionnel (story 2.1)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── PostgreSQL (serveur) ────────────────────────────────────────────────────
export const structuresPg = pgTable('structures', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  name: pgText('name').notNull(),
  address: pgText('address').notNull(),
  siret: pgText('siret').unique(), // nullable — SIRET optionnel (story 2.1)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const invitationsPg = pgTable('invitations', {
  id: pgText('id').primaryKey(),
  email: pgText('email').notNull(),
  role: pgText('role', { enum: ['idel', 'doctor'] }).notNull(),
  structureId: pgText('structure_id').notNull(),
  invitedBy: pgText('invited_by').notNull(),
  token: pgText('token').notNull().unique(),
  status: pgText('status', { enum: ['pending', 'accepted', 'expired'] }).notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
