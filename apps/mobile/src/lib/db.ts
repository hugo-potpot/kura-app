import { Platform } from 'react-native';

import type { AppDb } from './db.native';

/**
 * Point d'entrée unique : évite d'importer expo-sqlite dans le bundle web (WASM manquant / Metro).
 * Le natif charge `db.native`, le web charge `db.web` (sql.js).
 */
export async function getDb(): Promise<AppDb> {
  if (Platform.OS === 'web') {
    const { getDb: getWeb } = await import('./db.web');
    return (await getWeb()) as unknown as AppDb;
  }
  const { getDb: getNative } = await import('./db.native');
  return getNative();
}

export type { AppDb } from './db.native';
