import { useQuery } from '@tanstack/react-query';
import { desc, eq, gte, and } from 'drizzle-orm';
import { transmissions, patients } from '@kura/db';
import { getDb } from '@/lib/db';
import type { CareType } from '../services/care-type-templates';
import { syncTransmissionsFromServer } from '../services/syncTransmissionsFromServer';

export type TransmissionFilter = 'today' | 'week' | 'all';

export interface TransmissionRow {
  id: string;
  patientId: string;
  patientName: string;
  authorId: string;
  contentValidated: string;
  careType: CareType;
  createdAt: Date;
  syncedAt: Date | null;
}

async function fetchTransmissions(
  patientId: string | null,
  filter: TransmissionFilter,
): Promise<TransmissionRow[]> {
  // Descente serveur → local avant lecture (échec silencieux : hors-ligne, on lit le local).
  await syncTransmissionsFromServer().catch(() => undefined);

  const db = await getDb();

  const now = new Date();
  let fromDate: Date | null = null;
  if (filter === 'today') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === 'week') {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const conditions = [];
  if (patientId !== null) conditions.push(eq(transmissions.patientId, patientId));
  if (fromDate !== null) conditions.push(gte(transmissions.createdAt, fromDate));

  const rows = await db
    .select({
      id: transmissions.id,
      patientId: transmissions.patientId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      authorId: transmissions.authorId,
      contentValidated: transmissions.contentValidated,
      careType: transmissions.careType,
      createdAt: transmissions.createdAt,
      syncedAt: transmissions.syncedAt,
    })
    .from(transmissions)
    .leftJoin(patients, eq(transmissions.patientId, patients.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transmissions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName:
      r.patientFirstName && r.patientLastName
        ? `${r.patientFirstName} ${r.patientLastName}`
        : 'Patient inconnu',
    authorId: r.authorId,
    contentValidated: r.contentValidated,
    careType: r.careType as CareType,
    createdAt: r.createdAt,
    syncedAt: r.syncedAt,
  }));
}

export function useTransmissions(
  patientId: string | null = null,
  filter: TransmissionFilter = 'all',
) {
  return useQuery({
    queryKey: ['transmissions', patientId, filter],
    queryFn: () => fetchTransmissions(patientId, filter),
    staleTime: 5_000,
  });
}
