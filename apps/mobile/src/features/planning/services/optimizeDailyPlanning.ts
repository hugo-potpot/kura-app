import { and, eq } from 'drizzle-orm';

import { planningEntries } from '@kura/db';

import type { AppDb } from '@/lib/db';

import { optimizeVisitOrder, type VisitNode } from '../algorithm/tsp-optimizer';
import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';
import type { PlanningVisitRow } from '../model/types';

function planningRowsToVisitNodes(rows: readonly PlanningVisitRow[]): VisitNode[] {
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

export interface OptimizeDailyPlanningResult {
  readonly segmentByEntryId: ReadonlyMap<string, { orderIndex: number; etaMinutes: number; explanationLine: string }>;
}

/**
 * Recalcule NN+2-opt puis persiste `order_index`, `eta_minutes`, `updated_at`, `synced_at=null` (100 % local).
 */
export async function optimizeDailyPlanning(
  db: AppDb,
  idelId: string,
  dateKey: string,
): Promise<OptimizeDailyPlanningResult> {
  const rows = await fetchPlanningVisitsForDate(db, idelId, dateKey);
  if (rows.length === 0) {
    return { segmentByEntryId: new Map() };
  }

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const segments = optimizeVisitOrder(planningRowsToVisitNodes(rows));
  const segmentByEntryId = new Map<
    string,
    { orderIndex: number; etaMinutes: number; explanationLine: string }
  >();
  for (const s of segments) {
    segmentByEntryId.set(s.entryId, {
      orderIndex: s.orderIndex,
      etaMinutes: s.etaMinutes,
      explanationLine: s.explanationLine,
    });
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    for (const s of segments) {
      await tx
        .update(planningEntries)
        .set({
          orderIndex: s.orderIndex,
          etaMinutes: s.etaMinutes,
          updatedAt: now,
          syncedAt: null,
        })
        .where(
          and(
            eq(planningEntries.id, s.entryId),
            eq(planningEntries.idelId, idelId),
            eq(planningEntries.date, dateKey),
          ),
        );
    }
  });

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (__DEV__) {
    const elapsedMs = t1 - t0;
    // NFR-PERF-2 : cible < 5s pour ≤15 patients (calcul + persistance locale)
    // eslint-disable-next-line no-console
    console.info(
      `[planning.optimize] entries=${segments.length} durationMs=${elapsedMs.toFixed(0)} (NN+2-opt + SQLite)`,
    );
  }

  return { segmentByEntryId };
}
