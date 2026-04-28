import { useCallback, useState } from 'react';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';

import { optimizeDailyPlanning } from '../services/optimizeDailyPlanning';
import { usePlanningUxSession } from '../stores/planning-ux-session';
import { formatPlanningDateKey } from '../utils/planning-utils';

export function useOptimizePlanning(onComplete: () => void): {
  optimize: () => Promise<void>;
  tryFirstFocusOptimizeIfEligible: (opts: {
    visitsCount: number;
    isLoading: boolean;
    manualModePur: boolean;
    manualPreferencesReady: boolean;
  }) => Promise<void>;
  isOptimizing: boolean;
  explanationByEntryId: ReadonlyMap<string, string>;
} {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [explanationByEntryId, setExplanationByEntryId] = useState<Map<string, string>>(() => new Map());

  const runOptimizeCore = useCallback(async (): Promise<void> => {
    if (userId === null) return;
    const dk = formatPlanningDateKey(new Date());
    const db = await getDb();
    const { segmentByEntryId } = await optimizeDailyPlanning(db, userId, dk);
    const next = new Map<string, string>();
    for (const [id, seg] of segmentByEntryId) {
      next.set(id, seg.explanationLine);
    }
    setExplanationByEntryId(next);
    onComplete();
  }, [userId, onComplete]);

  const optimize = useCallback(async () => {
    if (userId === null) return;
    setIsOptimizing(true);
    try {
      await runOptimizeCore();
    } finally {
      setIsOptimizing(false);
    }
  }, [userId, runOptimizeCore]);

  const tryFirstFocusOptimizeIfEligible = useCallback(
    async (opts: {
      visitsCount: number;
      isLoading: boolean;
      manualModePur: boolean;
      manualPreferencesReady: boolean;
    }): Promise<void> => {
      if (!opts.manualPreferencesReady) return;
      if (userId === null || opts.isLoading || opts.visitsCount === 0 || opts.manualModePur) return;

    const dk = formatPlanningDateKey(new Date());
    const { syncSessionDate, peekEligibleFirstFocusOptimize, markFirstFocusOptimizeRan } =
      usePlanningUxSession.getState();
    syncSessionDate(dk);
    if (!peekEligibleFirstFocusOptimize(dk)) return;

    setIsOptimizing(true);
    try {
      await runOptimizeCore();
      markFirstFocusOptimizeRan(dk);
    } finally {
        setIsOptimizing(false);
      }
    },
    [userId, runOptimizeCore],
  );

  return { optimize, tryFirstFocusOptimizeIfEligible, isOptimizing, explanationByEntryId };
}
