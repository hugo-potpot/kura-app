import { and, eq } from 'drizzle-orm';

import { planningEntries } from '@kura/db';

import type { AppDb } from '@/lib/db';

import { computeEtaSegmentsForPlanningDayOrder, type VisitNode } from '../algorithm/tsp-optimizer';
import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';
import type { PlanningVisitRow } from '../model/types';

export function planningRowsToVisitNodes(rows: readonly PlanningVisitRow[]): VisitNode[] {
  return rows.map((r) => ({
    entryId: r.entryId,
    patientId: r.patientId,
    latitude: r.latitude,
    longitude: r.longitude,
    patientFirstName: r.patientFirstName,
    patientLastName: r.patientLastName,
    stabilityOrder: r.orderIndex,
  }));
}

/**
 * Persistance bulk : `order_index`, `eta_minutes`, `updated_at`, `synced_at = null` pour l’ordre manuel.
 */
export async function persistManualPlanningOrder(
  db: AppDb,
  idelId: string,
  dateKey: string,
  orderedEntryIds: readonly string[],
): Promise<void> {
  const rows = await fetchPlanningVisitsForDate(db, idelId, dateKey);
  if (rows.length === 0) return;

  const byId = new Map(rows.map((r) => [r.entryId, r]));

  if (orderedEntryIds.length !== rows.length) {
    throw new Error('persistManualPlanningOrder: la nouvelle liste ne correspond pas aux entrées du jour');
  }

  const seenId = new Set<string>();
  const orderedRows: PlanningVisitRow[] = [];
  for (const id of orderedEntryIds) {
    const hit = byId.get(id);
    if (hit === undefined) throw new Error(`persistManualPlanningOrder: entrée inconnue ${id}`);
    if (seenId.has(id)) throw new Error('persistManualPlanningOrder: identifiant dupliqué');
    seenId.add(id);
    orderedRows.push(hit);
  }

  const segments = computeEtaSegmentsForPlanningDayOrder(orderedRows, { renumberOrderIndex: true });
  const segmentByEntry = new Map(segments.map((s) => [s.entryId, s]));
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const id of orderedEntryIds) {
      const seg = segmentByEntry.get(id);
      if (seg === undefined) throw new Error(`persistManualPlanningOrder: segment manquant ${id}`);
      await tx
        .update(planningEntries)
        .set({
          orderIndex: seg.orderIndex,
          etaMinutes: seg.etaMinutes,
          updatedAt: now,
          syncedAt: null,
        })
        .where(
          and(
            eq(planningEntries.id, id),
            eq(planningEntries.idelId, idelId),
            eq(planningEntries.date, dateKey),
          ),
        );
    }
  });
}
