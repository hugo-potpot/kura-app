import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from '@kura/db';

import { SQLITE_DDL } from './sqlite-ddl';

const sqlite = openDatabaseSync('kura.db');

// Crée les tables manquantes (installation fraîche)
sqlite.execSync(SQLITE_DDL);

// Migrations incrémentales — ALTER TABLE ignore les erreurs si la colonne existe déjà.
// Ajouter ici chaque colonne introduite après le DDL initial.
const MIGRATIONS = [
  // v1 → v2 : ajout assigned_idel_id sur patients
  'ALTER TABLE patients ADD COLUMN assigned_idel_id TEXT',
  // v2 → v3 : table vital_signs (créée dans SQLITE_DDL, pas besoin de migration colonne)
];

for (const sql of MIGRATIONS) {
  try {
    sqlite.execSync(sql);
  } catch {
    // Colonne déjà présente — ignoré
  }
}

const _db = drizzle(sqlite, { schema });

export type AppDb = typeof _db;

export async function getDb(): Promise<AppDb> {
  return _db;
}
