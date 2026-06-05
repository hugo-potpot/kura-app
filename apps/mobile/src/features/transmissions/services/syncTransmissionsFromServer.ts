import { transmissions } from '@kura/db';

import { getDb } from '@/lib/db';
import { apiClient } from '@/lib/api-client';
import { getIsOnline } from '@/lib/useNetworkStatus';

import type { CareType } from './care-type-templates';

interface ServerTransmission {
  id: string;
  patientId: string;
  authorId: string;
  contentOriginal: string | null;
  contentValidated: string;
  careType: CareType;
  createdAt: string;
  updatedAt: string;
}

interface TransmissionsApiResponse {
  transmissions: ServerTransmission[];
}

export interface PullResult {
  pulled: number;
  failed: boolean;
}

/**
 * Descente serveur → SQLite local des transmissions de la structure.
 * `onConflictDoNothing` : ne réécrit jamais une transmission locale existante
 * (notamment celles créées hors-ligne et pas encore poussées, syncedAt = null).
 */
export async function syncTransmissionsFromServer(): Promise<PullResult> {
  const online = await getIsOnline();
  if (!online) return { pulled: 0, failed: false };

  let serverRows: ServerTransmission[];
  try {
    const res = await apiClient.get<{ data: TransmissionsApiResponse }>('/api/v1/transmissions');
    serverRows = res.data.data.transmissions;
  } catch {
    return { pulled: 0, failed: true };
  }

  if (serverRows.length === 0) return { pulled: 0, failed: false };

  const db = await getDb();
  const now = new Date();

  await db
    .insert(transmissions)
    .values(
      serverRows.map((t) => ({
        id: t.id,
        patientId: t.patientId,
        authorId: t.authorId,
        contentOriginal: t.contentOriginal,
        contentValidated: t.contentValidated,
        careType: t.careType,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        syncedAt: now,
      })),
    )
    .onConflictDoNothing({ target: transmissions.id });

  return { pulled: serverRows.length, failed: false };
}
