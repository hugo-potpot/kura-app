/**
 * Formatte une date en chaîne lisible (DD/MM/YYYY).
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Convertit une date en chaîne ISO 8601.
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Crée un objet Date depuis un timestamp Unix (secondes).
 */
export function fromTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}
