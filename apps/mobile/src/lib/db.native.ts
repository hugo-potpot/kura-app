import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from '@kura/db';

import { SQLITE_DDL } from './sqlite-ddl';

const sqlite = openDatabaseSync('kura.db');
sqlite.execSync(SQLITE_DDL);

const _db = drizzle(sqlite, { schema });

export type AppDb = typeof _db;

export async function getDb(): Promise<AppDb> {
  return _db;
}
