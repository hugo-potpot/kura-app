import { and, eq } from 'drizzle-orm';
import { planningEntries, patients } from '@kura/db';
import type { AppDb } from '@/lib/db';

/**
 * Vide les planning_entries du jour pour cet IDEL + les patients orphelins non-syncés.
 * Réservé au dev (appelé depuis un bouton __DEV__).
 */
export async function resetLocalPlanningForDate(
  db: AppDb,
  idelId: string,
  dateKey: string,
): Promise<void> {
  await db
    .delete(planningEntries)
    .where(and(eq(planningEntries.idelId, idelId), eq(planningEntries.date, dateKey)));
}

/** Vide toutes les tables locales (patients + planning_entries). Réservé au dev. */
export async function resetLocalDb(db: AppDb): Promise<void> {
  await db.delete(planningEntries);
  await db.delete(patients);
}
