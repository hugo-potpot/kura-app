import { COLORS } from '@/theme/kura-theme';

import type { PlanningVisitRow } from '../model/types';

import type { PlanningEntryStatus } from './planning-utils';

export interface PlanningMapPin {
  entryId: string;
  orderIndex: number;
  latitude: number;
  longitude: number;
  status: PlanningEntryStatus;
  patientFirstName: string;
  patientLastName: string;
}

export function pinColorForStatus(status: PlanningEntryStatus): string {
  if (status === 'done') return '#2E7D32';
  if (status === 'skipped') return '#FB8C00';
  return COLORS.primary;
}

/**
 * Pins carte : toutes les visites géolocalisées (y compris absent), tri `order_index`.
 * Les entrées sans lat/lng sont exclues.
 */
export function buildPlanningMapPins(visits: readonly PlanningVisitRow[]): PlanningMapPin[] {
  const out: PlanningMapPin[] = [];
  for (const v of visits) {
    if (v.latitude === null || v.longitude === null) continue;
    out.push({
      entryId: v.entryId,
      orderIndex: v.orderIndex,
      latitude: v.latitude,
      longitude: v.longitude,
      status: v.status,
      patientFirstName: v.patientFirstName,
      patientLastName: v.patientLastName,
    });
  }
  return [...out].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function mapPinAccessibilityLabel(
  orderIndex: number,
  status: PlanningEntryStatus,
): string {
  const step = orderIndex + 1;
  if (status === 'done') return `Patient étape ${step}, fait`;
  if (status === 'skipped') return `Patient étape ${step}, absent`;
  if (status === 'in_progress') return `Patient étape ${step}, en cours`;
  return `Patient étape ${step}, à faire`;
}
