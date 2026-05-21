import { and, eq, inArray } from 'drizzle-orm';

import { planningEntries, patients } from '@kura/db';
import { apiClient } from '@/lib/api-client';
import type { AppDb } from '@/lib/db';

interface ServerEntry {
  id: string;
  patientId: string;
  orderIndex: number;
  status: string;
  etaMinutes: number | null;
  patient: {
    id: string;
    structureId: string;
    firstName: string;
    lastName: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
}

interface PlanningApiResponse {
  date: string;
  entries: ServerEntry[];
}

export async function syncPlanningFromServer(
  db: AppDb,
  idelId: string,
  dateKey: string,
): Promise<void> {
  let serverEntries: ServerEntry[];

  try {
    const res = await apiClient.get<{ data: PlanningApiResponse }>(`/api/v1/planning?date=${dateKey}`);
    serverEntries = res.data.data.entries;
  } catch {
    return;
  }

  const localRows = await db
    .select()
    .from(planningEntries)
    .where(and(eq(planningEntries.idelId, idelId), eq(planningEntries.date, dateKey)))
    .orderBy(planningEntries.orderIndex);

  const localById = new Map(localRows.map((r) => [r.id, r]));
  const serverIds = new Set(serverEntries.map((e) => e.id));

  const now = new Date();

  await db.transaction(async (tx) => {
    // Upsert des patients dans le SQLite local (le JOIN fetchPlanningVisitsForDate en a besoin)
    for (const entry of serverEntries) {
      const p = entry.patient;
      await tx
        .insert(patients)
        .values({
          id: p.id,
          structureId: p.structureId,
          firstName: p.firstName,
          lastName: p.lastName,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: patients.id,
          set: {
            firstName: p.firstName,
            lastName: p.lastName,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
            updatedAt: now,
            syncedAt: now,
          },
        });
    }

    // Supprimer les entrées absentes du serveur :
    // - syncedAt === null → jamais venues du serveur (seed local, urgence hors-ligne) → supprimer
    // - status === 'pending' → visites pas encore démarrées retirées par l'admin → supprimer
    // - status non-pending + syncedAt !== null → visite en cours/terminée → conserver
    const toDelete = localRows.filter(
      (r) => !serverIds.has(r.id) && (r.syncedAt === null || r.status === 'pending'),
    );
    if (toDelete.length > 0) {
      await tx
        .delete(planningEntries)
        .where(inArray(planningEntries.id, toDelete.map((r) => r.id)));
    }

    for (const entry of serverEntries) {
      const local = localById.get(entry.id);

      if (local === undefined) {
        // Nouvelle entrée serveur → insertion
        await tx.insert(planningEntries).values({
          id: entry.id,
          patientId: entry.patient.id,
          idelId,
          date: dateKey,
          orderIndex: entry.orderIndex,
          status: 'pending',
          etaMinutes: entry.etaMinutes,
          createdAt: now,
          updatedAt: now,
          syncedAt: now,
        });
      } else if (local.status === 'pending') {
        // Entrée existante non démarrée → mise à jour (réordonnancement admin)
        await tx
          .update(planningEntries)
          .set({
            orderIndex: entry.orderIndex,
            etaMinutes: entry.etaMinutes,
            updatedAt: now,
            syncedAt: now,
          })
          .where(
            and(
              eq(planningEntries.id, entry.id),
              eq(planningEntries.idelId, idelId),
            ),
          );
      } else {
        // Visite en cours / terminée / skippée → préserver statut, juste syncedAt
        await tx
          .update(planningEntries)
          .set({ syncedAt: now })
          .where(
            and(
              eq(planningEntries.id, entry.id),
              eq(planningEntries.idelId, idelId),
            ),
          );
      }
    }
  });
}
