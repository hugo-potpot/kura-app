export type PlanningEntryStatus = 'pending' | 'in_progress' | 'done' | 'skipped';

export interface PlanningEntry {
  id: string;
  patientId: string;
  idelId: string;
  date: string;
  orderIndex: number;
  status: PlanningEntryStatus;
  etaMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}

export interface CreatePlanningEntryInput {
  patientId: string;
  idelId: string;
  date: string;
  orderIndex: number;
  etaMinutes?: number;
}
