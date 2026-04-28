import type { PlanningEntryStatus } from '../utils/planning-utils';

export interface PlanningVisitRow {
  entryId: string;
  patientId: string;
  orderIndex: number;
  status: PlanningEntryStatus;
  etaMinutes: number | null;
  patientFirstName: string;
  patientLastName: string;
  addressShort: string;
  latitude: number | null;
  longitude: number | null;
  syncedAt: Date | null;
}
