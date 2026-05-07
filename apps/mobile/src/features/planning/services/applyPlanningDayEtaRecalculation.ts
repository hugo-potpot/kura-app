import { and, eq } from 'drizzle-orm';

import { planningEntries } from '@kura/db';

import type { AppDb } from '@/lib/db';

import { computeEtaSegmentsForPlanningDayOrder } from '../algorithm/tsp-optimizer';
import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';

/**
 * Recalcule uniquement les ETA / travel pour l’ordre courant (ex. après absent / undo absent),
 * sans changer les `order_index`.
 */
export async function applyPlanningDayEtaRecalculation(
  db: AppDb,
  idelId: string,
  dateKey: string,
): Promise<void> {
  const rows = await fetchPlanningVisitsForDate(db, idelId, dateKey);
  if (rows.length === 0) return;

  const sorted = [...rows].sort((a, b) => a.orderIndex - b.orderIndex);
  const segments = computeEtaSegmentsForPlanningDayOrder(sorted, { renumberOrderIndex: false });
  const segmentByEntry = new Map(segments.map((s) => [s.entryId, s]));
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const r of rows) {
      const seg = segmentByEntry.get(r.entryId);
      if (seg === undefined) {
        throw new Error(`applyPlanningDayEtaRecalculation: segment manquant ${r.entryId}`);
      }
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
            eq(planningEntries.id, r.entryId),
            eq(planningEntries.idelId, idelId),
            eq(planningEntries.date, dateKey),
          ),
        );
    }
  });
}
