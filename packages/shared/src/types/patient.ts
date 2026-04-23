export type PatientStatus = 'active' | 'archived';

export interface Patient {
  id: string;
  structureId: string;
  firstName: string;
  lastName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  treatingDoctor: string | null;
  assignedIdelId: string | null;
  status: PatientStatus;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}

export interface CreatePatientInput {
  structureId: string;
  firstName: string;
  lastName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  treatingDoctor?: string;
}
