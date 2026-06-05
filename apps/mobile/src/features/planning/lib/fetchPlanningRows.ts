import { and, asc, eq } from 'drizzle-orm';

import { patients, planningEntries } from '@kura/db';

import type { AppDb } from '@/lib/db';

import type { PlanningVisitRow } from '../model/types';
import { shortenAddress } from '../utils/planning-utils';
import type { PlanningEntryStatus } from '../utils/planning-utils';

export async function fetchPlanningVisitsForDate(
  db: AppDb,
  idelId: string,
  dateKey: string,
): Promise<PlanningVisitRow[]> {
  const rows = await db
    .select({
      entry: planningEntries,
      patient: patients,
    })
    .from(planningEntries)
    .innerJoin(patients, eq(planningEntries.patientId, patients.id))
    .where(and(eq(planningEntries.idelId, idelId), eq(planningEntries.date, dateKey)))
    .orderBy(asc(planningEntries.orderIndex));

  return rows.map((r) => ({
    entryId: r.entry.id,
    patientId: r.patient.id,
    orderIndex: r.entry.orderIndex,
    status: r.entry.status as PlanningEntryStatus,
    etaMinutes: r.entry.etaMinutes,
    patientFirstName: r.patient.firstName,
    patientLastName: r.patient.lastName,
    addressShort: shortenAddress(r.patient.address),
    addressFull: r.patient.address.trim(),
    latitude: r.patient.latitude,
    longitude: r.patient.longitude,
    syncedAt: r.entry.syncedAt,
  }));
}
