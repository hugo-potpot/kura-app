import { ulid } from 'ulidx';

/**
 * Génère un ULID valide côté client (format [0-9A-Z]{26}).
 * Utilise ulidx — compatible React Native / Expo (pas de dépendance native).
 */
export function generateId(): string {
  return ulid();
}
