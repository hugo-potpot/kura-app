import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import * as schema from '@kura/db';

import { SQLITE_DDL } from './sqlite-ddl';

let _db: SQLJsDatabase<typeof schema> | null = null;
let _init: Promise<SQLJsDatabase<typeof schema>> | null = null;

/** SQLite en mémoire sur le web (expo-sqlite + WASM n'est pas fiable côté Metro). */
export async function getDb(): Promise<SQLJsDatabase<typeof schema>> {
  if (_db) return _db;
  if (_init != null) return _init;
  _init = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
    const raw = new SQL.Database();
    raw.run(SQLITE_DDL);
    _db = drizzle(raw, { schema });
    return _db;
  })();
  return _init;
}
