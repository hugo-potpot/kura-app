import { isNull, inArray } from 'drizzle-orm';
import { transmissions } from '@kura/db';

import { getDb } from '@/lib/db';
import { apiClient } from '@/lib/api-client';
import { getIsOnline } from '@/lib/useNetworkStatus';

export interface SyncResult {
  synced: number;
  failed: boolean;
}

export async function syncTransmissions(): Promise<SyncResult> {
  const online = await getIsOnline();
  if (!online) return { synced: 0, failed: false };

  const db = await getDb();

  const pending = await db
    .select()
    .from(transmissions)
    .where(isNull(transmissions.syncedAt));

  if (pending.length === 0) return { synced: 0, failed: false };

  try {
    await apiClient.post('/api/v1/transmissions', {
      transmissions: pending.map((t) => ({
        id: t.id,
        patientId: t.patientId,
        authorId: t.authorId,
        contentOriginal: t.contentOriginal,
        contentValidated: t.contentValidated,
        careType: t.careType,
        createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
      })),
    });

    const syncedIds = pending.map((t) => t.id);
    const now = new Date();

    await db
      .update(transmissions)
      .set({ syncedAt: now })
      .where(inArray(transmissions.id, syncedIds));

    return { synced: pending.length, failed: false };
  } catch {
    return { synced: 0, failed: true };
  }
}
