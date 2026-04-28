import { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';

import { optimizeDailyPlanning } from '../services/optimizeDailyPlanning';
import { formatPlanningDateKey } from '../utils/planning-utils';

export function useOptimizePlanning(onComplete: () => void): {
  optimize: () => Promise<void>;
  isOptimizing: boolean;
  explanationByEntryId: ReadonlyMap<string, string>;
} {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const dateKey = useMemo(() => formatPlanningDateKey(new Date()), []);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [explanationByEntryId, setExplanationByEntryId] = useState<Map<string, string>>(() => new Map());

  const optimize = useCallback(async () => {
    if (userId === null) return;
    setIsOptimizing(true);
    try {
      const db = await getDb();
      const { segmentByEntryId } = await optimizeDailyPlanning(db, userId, dateKey);
      const next = new Map<string, string>();
      for (const [id, seg] of segmentByEntryId) {
        next.set(id, seg.explanationLine);
      }
      setExplanationByEntryId(next);
      onComplete();
    } finally {
      setIsOptimizing(false);
    }
  }, [userId, dateKey, onComplete]);

  return { optimize, isOptimizing, explanationByEntryId };
}
