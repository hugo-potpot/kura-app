import type { PlanningVisitRow } from '../model/types';

/**
 * Convertit un index d’insertion sur la sous-liste « actifs » (non skipped)
 * en index global dans la liste triée par `orderIndex`.
 */
export function globalInsertPosFromActiveIndex(
  sortedRows: readonly PlanningVisitRow[],
  activeInsertIndex: number,
): number {
  const activePositions: number[] = [];
  sortedRows.forEach((r, idx) => {
    if (r.status !== 'skipped') activePositions.push(idx);
  });
  if (activePositions.length === 0) {
    return 0;
  }
  if (activeInsertIndex <= 0) {
    return activePositions[0] ?? 0;
  }
  if (activeInsertIndex >= activePositions.length) {
    const last = activePositions[activePositions.length - 1];
    return last !== undefined ? last + 1 : sortedRows.length;
  }
  const afterIdx = activePositions[activeInsertIndex - 1];
  return afterIdx !== undefined ? afterIdx + 1 : sortedRows.length;
}
