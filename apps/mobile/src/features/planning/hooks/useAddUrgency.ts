import { useCallback, useState } from 'react';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { planningEntries, patients } from '@kura/db';
import { generateId } from '@kura/shared';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';
import { apiClient } from '@/lib/api-client';
import type { Patient } from '@kura/shared';

import { findOptimalInsertionIndex } from '../algorithm/tsp-optimizer';
import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';
import type { PlanningVisitRow } from '../model/types';
import { persistManualPlanningOrder } from '../services/persistManualPlanningOrder';
import { usePlanningUxSession } from '../stores/planning-ux-session';
import { formatPlanningDateKey } from '../utils/planning-utils';
import { globalInsertPosFromActiveIndex } from '../utils/urgencyInsertPosition';

import { patientDisplayName } from './usePlanning';

export interface UrgencyPatientOption {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
}

export interface UrgencySuggestion {
  readonly globalInsertIndex: number;
  /** Libellé « après X » ou null si en tête. */
  readonly afterPatientName: string | null;
}

function buildUrgencySuggestion(
  sortedVisits: readonly PlanningVisitRow[],
  patient: Pick<UrgencyPatientOption, 'latitude' | 'longitude'>,
): UrgencySuggestion {
  const activeRowsInOrder = sortedVisits.filter((r) => r.status !== 'skipped');
  const activeGeo = activeRowsInOrder.map((r) => ({
    latitude: r.latitude,
    longitude: r.longitude,
  }));
  const { index: activeIx } = findOptimalInsertionIndex(
    { latitude: patient.latitude, longitude: patient.longitude },
    activeGeo,
  );
  const globalInsertIndex = globalInsertPosFromActiveIndex(sortedVisits, activeIx);
  let afterPatientName: string | null = null;
  if (activeIx > 0) {
    const prev = activeRowsInOrder[activeIx - 1];
    if (prev !== undefined) afterPatientName = patientDisplayName(prev);
  }
  return { globalInsertIndex, afterPatientName };
}

export interface UseAddUrgencyResult {
  readonly candidates: UrgencyPatientOption[];
  readonly loadCandidates: () => Promise<void>;
  readonly suggestUrgencyInsertion: (
    patient: Pick<UrgencyPatientOption, 'latitude' | 'longitude'>,
    currentVisits: readonly PlanningVisitRow[],
  ) => UrgencySuggestion;
  readonly addUrgency: (
    patientId: string,
    globalInsertIndex: number,
    currentVisits: readonly PlanningVisitRow[],
  ) => Promise<void>;
}

export function useAddUrgency(refetchPlanning: () => void): UseAddUrgencyResult {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const dateKey = formatPlanningDateKey(new Date());
  const markManualReorder = usePlanningUxSession((s) => s.markManualReorder);
  const [candidates, setCandidates] = useState<UrgencyPatientOption[]>([]);

  const loadCandidates = useCallback(async (): Promise<void> => {
    if (userId === null) {
      setCandidates([]);
      return;
    }
    const db = await getDb();
    const planned = await fetchPlanningVisitsForDate(db, userId, dateKey);
    const plannedIds = planned.map((p) => p.patientId);
    const plannedSet = new Set(plannedIds);

    // Source primaire : serveur. La route /patients filtre déjà par assignedIdelId
    // pour le rôle idel (le SQLite local ne synchronise pas assignedIdelId).
    try {
      const res = await apiClient.get<{ data: { patients: Patient[] } }>(
        '/api/v1/patients?status=active',
      );
      const serverPatients = res.data.data.patients;

      // Upsert local des patients : nécessaire pour que l'ajout au planning (innerJoin patients)
      // fonctionne, et renseigne assignedIdelId en local (repli hors-ligne).
      if (serverPatients.length > 0) {
        const upsertNow = new Date();
        await db
          .insert(patients)
          .values(
            serverPatients.map((p) => ({
              id: p.id,
              structureId: p.structureId,
              firstName: p.firstName,
              lastName: p.lastName,
              address: p.address,
              latitude: p.latitude,
              longitude: p.longitude,
              phone: p.phone,
              treatingDoctor: p.treatingDoctor,
              assignedIdelId: p.assignedIdelId,
              status: p.status,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
              syncedAt: upsertNow,
            })),
          )
          .onConflictDoUpdate({
            target: patients.id,
            set: {
              firstName: sql`excluded.first_name`,
              lastName: sql`excluded.last_name`,
              address: sql`excluded.address`,
              latitude: sql`excluded.latitude`,
              longitude: sql`excluded.longitude`,
              assignedIdelId: sql`excluded.assigned_idel_id`,
              status: sql`excluded.status`,
              updatedAt: sql`excluded.updated_at`,
              syncedAt: sql`excluded.synced_at`,
            },
          });
      }

      setCandidates(
        serverPatients
          .filter((p) => !plannedSet.has(p.id))
          .map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
      );
      return;
    } catch {
      // Repli hors-ligne : patients locaux assignés (peut être vide si non synchronisés).
    }

    const baseCond = and(
      eq(patients.assignedIdelId, userId),
      eq(patients.status, 'active'),
    );
    const rows =
      plannedIds.length === 0
        ? await db
            .select({
              id: patients.id,
              firstName: patients.firstName,
              lastName: patients.lastName,
              latitude: patients.latitude,
              longitude: patients.longitude,
            })
            .from(patients)
            .where(baseCond)
        : await db
            .select({
              id: patients.id,
              firstName: patients.firstName,
              lastName: patients.lastName,
              latitude: patients.latitude,
              longitude: patients.longitude,
            })
            .from(patients)
            .where(and(baseCond, notInArray(patients.id, plannedIds)));

    setCandidates(
      rows.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        latitude: r.latitude,
        longitude: r.longitude,
      })),
    );
  }, [userId, dateKey]);

  const suggestUrgencyInsertion = useCallback(
    (
      patient: Pick<UrgencyPatientOption, 'latitude' | 'longitude'>,
      currentVisits: readonly PlanningVisitRow[],
    ): UrgencySuggestion => {
      const sorted = [...currentVisits].sort((a, b) => a.orderIndex - b.orderIndex);
      return buildUrgencySuggestion(sorted, patient);
    },
    [],
  );

  const addUrgency = useCallback(
    async (
      patientId: string,
      globalInsertIndex: number,
      currentVisits: readonly PlanningVisitRow[],
    ): Promise<void> => {
      if (userId === null) return;

      const sorted = [...currentVisits].sort((a, b) => a.orderIndex - b.orderIndex);
      const existingIds = sorted.map((r) => r.entryId);
      const clamped = Math.max(0, Math.min(globalInsertIndex, existingIds.length));
      const newId = generateId();
      const newOrderedIds = [...existingIds.slice(0, clamped), newId, ...existingIds.slice(clamped)];

      const db = await getDb();
      const now = new Date();

      await db.insert(planningEntries).values({
        id: newId,
        patientId,
        idelId: userId,
        date: dateKey,
        orderIndex: 0,
        status: 'pending',
        etaMinutes: null,
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
      });

      await persistManualPlanningOrder(db, userId, dateKey, newOrderedIds);

      // Persistance serveur : sans push, le sync suivant supprimerait l'entrée locale
      // (pending + syncedAt null absente du serveur). Best-effort : reste local si hors-ligne.
      try {
        await apiClient.post('/api/v1/planning', {
          id: newId,
          patientId,
          date: dateKey,
          orderIndex: clamped,
        });
        await db
          .update(planningEntries)
          .set({ syncedAt: new Date() })
          .where(eq(planningEntries.id, newId));
      } catch {
        // hors-ligne : l'entrée reste locale jusqu'à la prochaine synchronisation
      }

      markManualReorder();
      refetchPlanning();
    },
    [userId, dateKey, markManualReorder, refetchPlanning],
  );

  return {
    candidates,
    loadCandidates,
    suggestUrgencyInsertion,
    addUrgency,
  };
}
