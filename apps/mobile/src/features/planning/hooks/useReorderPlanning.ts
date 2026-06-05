import { useCallback, useEffect, useRef, useState } from 'react';

import { useHaptics } from '@/hooks/useHaptics';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';
import { apiClient } from '@/lib/api-client';

import type { PlanningVisitRow } from '../model/types';
import { persistManualPlanningOrder } from '../services/persistManualPlanningOrder';
import { usePlanningUxSession } from '../stores/planning-ux-session';
import { formatPlanningDateKey } from '../utils/planning-utils';

const UNDONE_MSG_MS = 2800;

export interface UseReorderPlanningResult {
  draggableRows: PlanningVisitRow[];
  syncDraggableFromVisits: () => void;
  onDragBegin: () => void;
  onDragEnd: (params: {
    data: PlanningVisitRow[];
    from: number;
    to: number;
  }) => Promise<void>;

  snackbarVisible: boolean;
  snackbarActionLabel: string | null;
  onUndoSnackbarPress: () => Promise<void>;
  onDismissSnackbar: () => void;

  infoSnackbarVisible: boolean;
  infoSnackbarMessage: string;
  onDismissInfoSnackbar: () => void;
}

export function useReorderPlanning(
  visits: PlanningVisitRow[],
  refetchPlanning: () => void,
): UseReorderPlanningResult {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const dateKey = formatPlanningDateKey(new Date());
  const { trigger: haptic } = useHaptics();

  const syncSessionDate = usePlanningUxSession((s) => s.syncSessionDate);
  const markManualReorder = usePlanningUxSession((s) => s.markManualReorder);

  const [draggableRows, setDraggableRows] = useState<PlanningVisitRow[]>(visits);

  const orderBeforeDragIdsRef = useRef<string[]>([]);
  const pendingUndoIdsRef = useRef<string[] | null>(null);

  const undoneMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [infoSnackbarVisible, setInfoSnackbarVisible] = useState(false);

  useEffect(() => {
    syncSessionDate(dateKey);
  }, [dateKey, syncSessionDate]);

  useEffect(() => {
    setDraggableRows(visits);
  }, [visits]);

  const clearUndoneTimer = useCallback((): void => {
    if (undoneMsgTimerRef.current !== null) {
      clearTimeout(undoneMsgTimerRef.current);
      undoneMsgTimerRef.current = null;
    }
  }, []);

  const finalizeUndoWindow = useCallback((): void => {
    pendingUndoIdsRef.current = null;
    setSnackbarVisible(false);
  }, []);

  const syncDraggableFromVisits = useCallback(() => {
    setDraggableRows(visits);
  }, [visits]);

  const onDragBegin = useCallback(() => {
    orderBeforeDragIdsRef.current = draggableRows.map((r) => r.entryId);
    haptic('light');
  }, [draggableRows, haptic]);

  const persistOrder = useCallback(
    async (orderedIds: readonly string[]): Promise<void> => {
      if (userId === null) return;
      const db = await getDb();
      const ordered = await persistManualPlanningOrder(db, userId, dateKey, orderedIds);

      // Push serveur : sans cela, le pull (syncPlanningFromServer) réécrirait l'order_index
      // depuis le serveur et annulerait le déplacement. Best-effort : reste local si hors-ligne.
      if (ordered.length > 0) {
        try {
          await apiClient.patch('/api/v1/planning', {
            entries: ordered.map((e) => ({
              id: e.id,
              orderIndex: e.orderIndex,
              etaMinutes: e.etaMinutes,
            })),
          });
        } catch {
          // hors-ligne : l'ordre reste local jusqu'à la prochaine synchronisation
        }
      }
    },
    [userId, dateKey],
  );

  const onDragEnd = useCallback(
    async (params: { data: PlanningVisitRow[]; from: number; to: number }): Promise<void> => {
      const { data, from, to } = params;
      if (from === to || userId === null) {
        return;
      }

      const previousIds = [...orderBeforeDragIdsRef.current];
      const newIds = data.map((r) => r.entryId);

      setDraggableRows(data);
      haptic('medium');

      try {
        await persistOrder(newIds);
        markManualReorder();
        if (previousIds.length === newIds.length && previousIds.length > 0) {
          pendingUndoIdsRef.current = [...previousIds];
          setSnackbarVisible(true);
        }
        refetchPlanning();
      } catch {
        syncDraggableFromVisits();
      }
    },
    [userId, persistOrder, markManualReorder, refetchPlanning, syncDraggableFromVisits, haptic],
  );

  const onUndoSnackbarPress = useCallback(async (): Promise<void> => {
    const restoreIds = pendingUndoIdsRef.current;
    if (restoreIds === null || userId === null) return;

    finalizeUndoWindow();
    haptic('light');

    try {
      await persistOrder(restoreIds);
      markManualReorder();
      refetchPlanning();

      setInfoSnackbarVisible(true);
      clearUndoneTimer();
      undoneMsgTimerRef.current = setTimeout(() => {
        setInfoSnackbarVisible(false);
      }, UNDONE_MSG_MS);
    } catch {
      syncDraggableFromVisits();
    }
  }, [
    userId,
    persistOrder,
    markManualReorder,
    refetchPlanning,
    finalizeUndoWindow,
    syncDraggableFromVisits,
    clearUndoneTimer,
    haptic,
  ]);

  const onDismissSnackbar = useCallback((): void => {
    finalizeUndoWindow();
  }, [finalizeUndoWindow]);

  const onDismissInfoSnackbar = useCallback((): void => {
    clearUndoneTimer();
    setInfoSnackbarVisible(false);
  }, [clearUndoneTimer]);

  useEffect(
    (): (() => void) => (): void => {
      clearUndoneTimer();
    },
    [clearUndoneTimer],
  );

  return {
    draggableRows,
    syncDraggableFromVisits,
    onDragBegin,
    onDragEnd,
    snackbarVisible,
    snackbarActionLabel: snackbarVisible ? 'Annuler' : null,
    onUndoSnackbarPress,
    onDismissSnackbar,
    infoSnackbarVisible,
    infoSnackbarMessage: 'Modification annulée',
    onDismissInfoSnackbar,
  };
}
