import type { AppDb } from '@/lib/db';

import {
  computeEtaSegmentsForPlanningDayOrder,
  optimizeVisitOrder,
  type VisitNode,
} from '../algorithm/tsp-optimizer';
import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';
import type { PlanningVisitRow } from '../model/types';
import { persistManualPlanningOrder } from './persistManualPlanningOrder';

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
  readonly segmentByEntryId: ReadonlyMap<
    string,
    { orderIndex: number; etaMinutes: number | null; explanationLine: string }
  >;
}

/**
 * Recalcule NN+2-opt puis persiste `order_index`, `eta_minutes`, `updated_at`, `synced_at=null` (100 % local).
 * Les entrées `skipped` restent en fin de tournée sans participer à l’optimisation.
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

  const active = rows.filter((r) => r.status !== 'skipped');
  const skipped = rows
    .filter((r) => r.status === 'skipped')
    .sort((a, b) => a.orderIndex - b.orderIndex);

  let fullOrderedIds: string[];
  if (active.length === 0) {
    fullOrderedIds = skipped.map((s) => s.entryId);
  } else {
    const segmentsOpt = optimizeVisitOrder(planningRowsToVisitNodes(active));
    const activeIds = [...segmentsOpt]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => s.entryId);
    fullOrderedIds = [...activeIds, ...skipped.map((s) => s.entryId)];
  }

  await persistManualPlanningOrder(db, idelId, dateKey, fullOrderedIds);

  const refreshed = await fetchPlanningVisitsForDate(db, idelId, dateKey);
  const segmentByEntryId = new Map<
    string,
    { orderIndex: number; etaMinutes: number | null; explanationLine: string }
  >();
  const finalSegs = computeEtaSegmentsForPlanningDayOrder(
    [...refreshed].sort((a, b) => a.orderIndex - b.orderIndex),
    { renumberOrderIndex: false },
  );
  for (const s of finalSegs) {
    segmentByEntryId.set(s.entryId, {
      orderIndex: s.orderIndex,
      etaMinutes: s.etaMinutes,
      explanationLine: s.explanationLine,
    });
  }

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (__DEV__) {
    const elapsedMs = t1 - t0;
    // NFR-PERF-2 : cible < 5s pour ≤15 patients (calcul + persistance locale)
    // eslint-disable-next-line no-console
    console.info(
      `[planning.optimize] entries=${refreshed.length} durationMs=${elapsedMs.toFixed(0)} (NN+2-opt + SQLite)`,
    );
  }

  return { segmentByEntryId };
}
