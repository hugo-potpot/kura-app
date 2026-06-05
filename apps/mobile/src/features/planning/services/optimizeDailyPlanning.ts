import type { AppDb } from '@/lib/db';

import {
  computeEtaSegmentsForPlanningDayOrder,
  optimizeVisitOrder,
  type PlanningDayTimelinePrefs,
  type VisitNode,
} from '../algorithm/tsp-optimizer';
import { apiClient } from '@/lib/api-client';

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
 * Les entrées `done` restent en tête (positions fixes, non réordonnancées).
 * Les entrées `pending`/`in_progress` sont optimisées après les `done`.
 * Les entrées `skipped` restent en queue sans participer à l’optimisation.
 */
export async function optimizeDailyPlanning(
  db: AppDb,
  idelId: string,
  dateKey: string,
  prefs?: PlanningDayTimelinePrefs,
): Promise<OptimizeDailyPlanningResult> {
  const rows = await fetchPlanningVisitsForDate(db, idelId, dateKey);
  if (rows.length === 0) {
    return { segmentByEntryId: new Map() };
  }

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  // Visites terminées : position fixe en tête (ordre courant préservé)
  const done = rows
    .filter((r) => r.status === 'done')
    .sort((a, b) => a.orderIndex - b.orderIndex);
  // Seules les visites non-démarrées / en cours participent à l'optimisation
  const toOptimize = rows.filter((r) => r.status === 'pending' || r.status === 'in_progress');
  const skipped = rows
    .filter((r) => r.status === 'skipped')
    .sort((a, b) => a.orderIndex - b.orderIndex);

  let fullOrderedIds: string[];
  if (toOptimize.length === 0) {
    fullOrderedIds = [
      ...done.map((s) => s.entryId),
      ...skipped.map((s) => s.entryId),
    ];
  } else {
    const segmentsOpt = optimizeVisitOrder(planningRowsToVisitNodes(toOptimize), prefs);
    const optimizedIds = [...segmentsOpt]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => s.entryId);
    // Ordre final : terminés (fixe) → optimisés → absents (fixe)
    fullOrderedIds = [
      ...done.map((s) => s.entryId),
      ...optimizedIds,
      ...skipped.map((s) => s.entryId),
    ];
  }

  const ordered = await persistManualPlanningOrder(db, idelId, dateKey, fullOrderedIds);

  // Push serveur : sans cela, le pull réécrirait l'ordre optimisé depuis le serveur.
  if (ordered.length > 0) {
    try {
      await apiClient.patch('/api/v1/planning', {
        entries: ordered.map((e) => ({
          id: e.id,
          orderIndex: e.orderIndex,
          etaMinutes: e.etaMinutes,
        })),
      });
    } catch {
      // hors-ligne : l'ordre optimisé reste local jusqu'à la prochaine synchronisation
    }
  }

  const refreshed = await fetchPlanningVisitsForDate(db, idelId, dateKey);
  const segmentByEntryId = new Map<
    string,
    { orderIndex: number; etaMinutes: number | null; explanationLine: string }
  >();
  const finalSegs = computeEtaSegmentsForPlanningDayOrder(
    [...refreshed].sort((a, b) => a.orderIndex - b.orderIndex),
    { renumberOrderIndex: false, prefs },
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
