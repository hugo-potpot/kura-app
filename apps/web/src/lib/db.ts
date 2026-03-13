import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@kura/db';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let _db: DbInstance | null = null;

/**
 * Retourne le client Drizzle PostgreSQL (initialisation paresseuse).
 * Lance une erreur si DATABASE_URL n'est pas défini à l'exécution.
 */
export function getDb(): DbInstance {
  if (_db) return _db;

  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  _db = drizzle(client, { schema });
  return _db;
}

/**
 * Accès direct au db — à utiliser uniquement côté serveur dans des
 * Server Actions ou Route Handlers (jamais au module top-level).
 */
export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return getDb()[prop as keyof DbInstance];
  },
});
