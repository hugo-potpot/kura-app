import { useCallback, useEffect, useRef, useState } from 'react';
import { and, eq } from 'drizzle-orm';
import { planningEntries } from '@kura/db';

import { useHaptics } from '@/hooks/useHaptics';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';

import { applyPlanningDayEtaRecalculation } from '../services/applyPlanningDayEtaRecalculation';
import type { PlanningEntryStatus } from '../utils/planning-utils';
import { formatPlanningDateKey } from '../utils/planning-utils';

const UNDO_MS = 5000;
const INFO_MS = 2800;

export interface UseCompleteVisitResult {
  markDone: (entryId: string, previousStatus: PlanningEntryStatus) => Promise<void>;
  doneSnackbarVisible: boolean;
  onDoneUndoPress: () => Promise<void>;
  onDoneSnackbarDismiss: () => void;
  doneInfoSnackbarVisible: boolean;
  doneInfoMessage: string;
  onDoneInfoDismiss: () => void;
}

export function useCompleteVisit(refetchPlanning: () => void): UseCompleteVisitResult {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const dateKey = formatPlanningDateKey(new Date());
  const { trigger: haptic } = useHaptics();

  const previousStatusRef = useRef<PlanningEntryStatus | null>(null);
  const pendingUndoEntryIdRef = useRef<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [doneSnackbarVisible, setDoneSnackbarVisible] = useState(false);
  const [doneInfoVisible, setDoneInfoVisible] = useState(false);
  const [doneInfoMessage, setDoneInfoMessage] = useState('');

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

  const finalizeDoneUndoWindow = useCallback((): void => {
    pendingUndoEntryIdRef.current = null;
    previousStatusRef.current = null;
    setDoneSnackbarVisible(false);
    clearUndoTimer();
  }, [clearUndoTimer]);

  const markDone = useCallback(
    async (entryId: string, previousStatus: PlanningEntryStatus): Promise<void> => {
      if (userId === null) return;

      haptic('medium');
      const db = await getDb();
      const now = new Date();

      await db
        .update(planningEntries)
        .set({ status: 'done', updatedAt: now, syncedAt: null })
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
      setDoneSnackbarVisible(true);
      undoTimerRef.current = setTimeout(() => {
        finalizeDoneUndoWindow();
      }, UNDO_MS);
    },
    [userId, dateKey, haptic, refetchPlanning, clearUndoTimer, finalizeDoneUndoWindow],
  );

  const onDoneUndoPress = useCallback(async (): Promise<void> => {
    const entryId = pendingUndoEntryIdRef.current;
    const prev = previousStatusRef.current;
    if (entryId === null || prev === null || userId === null) return;

    clearUndoTimer();
    setDoneSnackbarVisible(false);
    pendingUndoEntryIdRef.current = null;
    previousStatusRef.current = null;

    const db = await getDb();
    const now = new Date();
    await db
      .update(planningEntries)
      .set({ status: prev, updatedAt: now, syncedAt: null })
      .where(
        and(
          eq(planningEntries.id, entryId),
          eq(planningEntries.idelId, userId),
          eq(planningEntries.date, dateKey),
        ),
      );

    await applyPlanningDayEtaRecalculation(db, userId, dateKey);
    refetchPlanning();

    setDoneInfoMessage('Soin annulé');
    setDoneInfoVisible(true);
    clearInfoTimer();
    haptic('light');
    infoTimerRef.current = setTimeout(() => {
      setDoneInfoVisible(false);
    }, INFO_MS);
  }, [userId, dateKey, refetchPlanning, clearUndoTimer, clearInfoTimer, haptic]);

  const onDoneSnackbarDismiss = useCallback((): void => {
    finalizeDoneUndoWindow();
  }, [finalizeDoneUndoWindow]);

  const onDoneInfoDismiss = useCallback((): void => {
    clearInfoTimer();
    setDoneInfoVisible(false);
  }, [clearInfoTimer]);

  useEffect(() => {
    return (): void => {
      clearUndoTimer();
      clearInfoTimer();
    };
  }, [clearUndoTimer, clearInfoTimer]);

  return {
    markDone,
    doneSnackbarVisible,
    onDoneUndoPress,
    onDoneSnackbarDismiss,
    doneInfoSnackbarVisible: doneInfoVisible,
    doneInfoMessage,
    onDoneInfoDismiss,
  };
}
