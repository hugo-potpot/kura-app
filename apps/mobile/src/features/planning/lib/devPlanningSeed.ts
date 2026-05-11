import { and, count, eq } from 'drizzle-orm';

import { patients, planningEntries } from '@kura/db';
import type { AppDb } from '@/lib/db';
import { generateId } from '@kura/shared';

import { formatPlanningDateKey } from '../utils/planning-utils';

const SEED_PATIENTS = [
  { firstName: 'Marie', lastName: 'Dupont', address: '12 rue des Lilas, Lyon', latitude: 45.764, longitude: 4.8357 },
  { firstName: 'Jean', lastName: 'Martin', address: '4 allée des Roses, Lyon', latitude: 45.7578, longitude: 4.8321 },
  { firstName: 'Isabelle', lastName: 'Bernard', address: '27 avenue Jean Jaurès, Lyon', latitude: 45.751, longitude: 4.843 },
  { firstName: 'Robert', lastName: 'Leroy', address: '8 rue Garibaldi, Lyon', latitude: 45.7612, longitude: 4.851 },
  { firstName: 'Françoise', lastName: 'Moreau', address: '3 place Bellecour, Lyon', latitude: 45.7577, longitude: 4.8323 },
  { firstName: 'Michel', lastName: 'Simon', address: '15 rue de la République, Lyon', latitude: 45.764, longitude: 4.834 },
  { firstName: 'Colette', lastName: 'Laurent', address: '9 quai Saint-Antoine, Lyon', latitude: 45.7621, longitude: 4.8302 },
  { firstName: 'André', lastName: 'Petit', address: '22 rue Mercière, Lyon', latitude: 45.7598, longitude: 4.8315 },
];

function dateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatPlanningDateKey(d);
}

async function seedPatientsIfNeeded(db: AppDb, structureId: string): Promise<{ id: string }[]> {
  let rows = await db.select({ id: patients.id }).from(patients).limit(SEED_PATIENTS.length);
  if (rows.length >= SEED_PATIENTS.length) return rows;

  const now = new Date();
  await db.insert(patients).values(
    SEED_PATIENTS.map((p) => ({
      id: generateId(),
      structureId,
      firstName: p.firstName,
      lastName: p.lastName,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
      syncedAt: null as Date | null,
    })),
  );

  return db.select({ id: patients.id }).from(patients).limit(SEED_PATIENTS.length);
}

async function seedDayIfEmpty(
  db: AppDb,
  idelId: string,
  dateStr: string,
  patientIds: string[],
  statuses: ('pending' | 'done' | 'skipped')[],
): Promise<void> {
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(planningEntries)
    .where(and(eq(planningEntries.idelId, idelId), eq(planningEntries.date, dateStr)));

  // Re-seed si le jour est vide ou s'il a moins d'entrées que prévu (ancien seed)
  if ((existingCount ?? 0) >= patientIds.length) return;

  if ((existingCount ?? 0) > 0) {
    await db
      .delete(planningEntries)
      .where(and(eq(planningEntries.idelId, idelId), eq(planningEntries.date, dateStr)));
  }

  const now = new Date();
  const etas = [12, 20, 15, 18, 10, 25, 14, 16];

  await db.insert(planningEntries).values(
    patientIds.map((patientId, i) => ({
      id: generateId(),
      patientId,
      idelId,
      date: dateStr,
      orderIndex: i,
      status: statuses[i] ?? 'pending',
      etaMinutes: etas[i % etas.length] ?? 15,
      createdAt: now,
      updatedAt: now,
      syncedAt: null as Date | null,
    })),
  );
}

export async function seedDevPlanningIfEmpty(db: AppDb, idelId: string): Promise<void> {
  if (!__DEV__) return;

  const structureId = generateId();
  const patientRows = await seedPatientsIfNeeded(db, structureId);
  const ids = patientRows.map((r) => r.id);

  // Hier : quelques visites terminées
  await seedDayIfEmpty(db, idelId, dateKey(-1), ids.slice(0, 5), [
    'done', 'done', 'done', 'skipped', 'done',
  ]);

  // Aujourd'hui : mix pending / en cours
  await seedDayIfEmpty(db, idelId, dateKey(0), ids, [
    'done', 'done', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending',
  ]);

  // Demain : tout pending
  await seedDayIfEmpty(db, idelId, dateKey(1), ids.slice(0, 6), [
    'pending', 'pending', 'pending', 'pending', 'pending', 'pending',
  ]);
}