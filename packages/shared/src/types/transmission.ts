export type CareType = 'toilette' | 'pansement' | 'injection' | 'constantes' | 'autre';

export interface Transmission {
  id: string;
  patientId: string;
  authorId: string;
  contentOriginal: string | null;
  contentValidated: string;
  careType: CareType;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}

export interface CreateTransmissionInput {
  patientId: string;
  authorId: string;
  contentOriginal?: string;
  contentValidated: string;
  careType: CareType;
}
