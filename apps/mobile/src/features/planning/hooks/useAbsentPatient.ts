import { useCallback, useEffect, useRef, useState } from 'react';
import { and, eq } from 'drizzle-orm';
import { planningEntries } from '@kura/db';

import { useHaptics } from '@/hooks/useHaptics';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';

import { applyPlanningDayEtaRecalculation } from '../services/applyPlanningDayEtaRecalculation';
import type { PlanningEntryStatus } from '../utils/planning-utils';
import { formatPlanningDateKey } from '../utils/planning-utils';

const ABSENT_UNDO_MS = 5000;
const UNDONE_MSG_MS = 2800;

export interface UseAbsentPatientResult {
  confirmAndMarkAbsent: (entryId: string, previousStatus: PlanningEntryStatus) => Promise<void>;
  absentSnackbarVisible: boolean;
  absentSnackbarMessage: string;
  onAbsentUndoPress: () => Promise<void>;
  onAbsentSnackbarDismiss: () => void;
  absentInfoSnackbarVisible: boolean;
  absentInfoMessage: string;
  onAbsentInfoDismiss: () => void;
}

export function useAbsentPatient(refetchPlanning: () => void): UseAbsentPatientResult {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const dateKey = formatPlanningDateKey(new Date());
  const { trigger: haptic } = useHaptics();

  const previousStatusRef = useRef<PlanningEntryStatus | null>(null);
  const pendingUndoEntryIdRef = useRef<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [absentSnackbarVisible, setAbsentSnackbarVisible] = useState(false);
  const [absentInfoVisible, setAbsentInfoVisible] = useState(false);
  const [absentInfoMessage, setAbsentInfoMessage] = useState('');

  const clearUndoTimer = useCallback((): void => {
    if (undoTimerRef.current !== null) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const clearInfoTimer = useCallback((): void => {
    if (infoTimerRef.current !== null) {
      clearTimeout(infoTimerRef.current);
      infoTimerRef.current = null;
    }
  }, []);

  const finalizeAbsentUndoWindow = useCallback((): void => {
    pendingUndoEntryIdRef.current = null;
    previousStatusRef.current = null;
    setAbsentSnackbarVisible(false);
    clearUndoTimer();
  }, [clearUndoTimer]);

  const confirmAndMarkAbsent = useCallback(
    async (entryId: string, previousStatus: PlanningEntryStatus): Promise<void> => {
      if (userId === null) return;

      haptic('medium');
      const db = await getDb();
      const now = new Date();

      await db
        .update(planningEntries)
        .set({
          status: 'skipped',
          updatedAt: now,
          syncedAt: null,
        })
        .where(
          and(
            eq(planningEntries.id, entryId),
            eq(planningEntries.idelId, userId),
            eq(planningEntries.date, dateKey),
          ),
        );

      previousStatusRef.current = previousStatus;
      await applyPlanningDayEtaRecalculation(db, userId, dateKey);
      refetchPlanning();

      clearUndoTimer();
      pendingUndoEntryIdRef.current = entryId;
      setAbsentSnackbarVisible(true);
      undoTimerRef.current = setTimeout(() => {
        finalizeAbsentUndoWindow();
      }, ABSENT_UNDO_MS);
    },
    [userId, dateKey, haptic, refetchPlanning, clearUndoTimer, finalizeAbsentUndoWindow],
  );

  const onAbsentUndoPress = useCallback(async (): Promise<void> => {
    const entryId = pendingUndoEntryIdRef.current;
    const prev = previousStatusRef.current;
    if (entryId === null || prev === null || userId === null) return;

    clearUndoTimer();
    setAbsentSnackbarVisible(false);
    pendingUndoEntryIdRef.current = null;
    previousStatusRef.current = null;

    const db = await getDb();
    const now = new Date();
    await db
      .update(planningEntries)
      .set({
        status: prev,
        updatedAt: now,
        syncedAt: null,
      })
      .where(
        and(
          eq(planningEntries.id, entryId),
          eq(planningEntries.idelId, userId),
          eq(planningEntries.date, dateKey),
        ),
      );

    await applyPlanningDayEtaRecalculation(db, userId, dateKey);
    refetchPlanning();

    setAbsentInfoMessage('Retrait annulé');
    setAbsentInfoVisible(true);
    clearInfoTimer();
    haptic('light');
    infoTimerRef.current = setTimeout(() => {
      setAbsentInfoVisible(false);
    }, UNDONE_MSG_MS);
  }, [userId, dateKey, refetchPlanning, clearUndoTimer, clearInfoTimer, haptic]);

  const onAbsentSnackbarDismiss = useCallback((): void => {
    finalizeAbsentUndoWindow();
  }, [finalizeAbsentUndoWindow]);

  const onAbsentInfoDismiss = useCallback((): void => {
    clearInfoTimer();
    setAbsentInfoVisible(false);
  }, [clearInfoTimer]);

  useEffect(() => {
    return (): void => {
      clearUndoTimer();
      clearInfoTimer();
    };
  }, [clearUndoTimer, clearInfoTimer]);

  return {
    confirmAndMarkAbsent,
    absentSnackbarVisible,
    absentSnackbarMessage: 'Patient retiré — Annuler',
    onAbsentUndoPress,
    onAbsentSnackbarDismiss,
    absentInfoSnackbarVisible: absentInfoVisible,
    absentInfoMessage,
    onAbsentInfoDismiss,
  };
}
