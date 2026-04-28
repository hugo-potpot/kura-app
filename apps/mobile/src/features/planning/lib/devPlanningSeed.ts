import { and, eq } from 'drizzle-orm';

import { patients, planningEntries } from '@kura/db';
import type { AppDb } from '@/lib/db';
import { generateId } from '@kura/shared';

import { formatPlanningDateKey } from '../utils/planning-utils';

async function insertPlanningRows(
  db: AppDb,
  idelId: string,
  dateStr: string,
  patientRows: { id: string }[],
): Promise<void> {
  const now = new Date();
  const etaList = [12, 18, 10];
  const values = patientRows.slice(0, 5).map((p, i) => ({
    id: generateId(),
    patientId: p.id,
    idelId,
    date: dateStr,
    orderIndex: i,
    status: 'pending' as const,
    etaMinutes: etaList[i % etaList.length] ?? 15,
    createdAt: now,
    updatedAt: now,
    syncedAt: null as Date | null,
  }));
  if (values.length === 0) return;
  await db.insert(planningEntries).values(values);
}

/**
 * Données de démo strictement en __DEV__ : insère patients + entrées planning si la journée est vide.
 */
export async function seedDevPlanningIfEmpty(db: AppDb, idelId: string): Promise<void> {
  if (!__DEV__) return;
  const today = formatPlanningDateKey(new Date());

  const existing = await db
    .select({ id: planningEntries.id })
    .from(planningEntries)
    .where(and(eq(planningEntries.idelId, idelId), eq(planningEntries.date, today)))
    .limit(1);

  if (existing.length > 0) return;

  let patientRows = await db.select({ id: patients.id }).from(patients).limit(5);

  if (patientRows.length === 0) {
    const sid = generateId();
    const now = new Date();
    const ids = [generateId(), generateId()];
    await db.insert(patients).values([
      {
        id: ids[0],
        structureId: sid,
        firstName: 'Marie',
        lastName: 'Démo',
        address: '12 rue des Lilas, Lyon',
        latitude: 45.764,
        longitude: 4.8357,
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
        status: 'active',
      },
      {
        id: ids[1],
        structureId: sid,
        firstName: 'Jean',
        lastName: 'Démo',
        address: '4 allée des Roses, Lyon',
        latitude: 45.7578,
        longitude: 4.8321,
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
        status: 'active',
      },
    ]);
    patientRows = await db.select({ id: patients.id }).from(patients).limit(5);
  }

  await insertPlanningRows(db, idelId, today, patientRows);
}
