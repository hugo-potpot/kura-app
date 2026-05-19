import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';

import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';
import { seedDevPlanningIfEmpty } from '../lib/devPlanningSeed';
import type { PlanningVisitRow } from '../model/types';
import type { PlanningMapPin } from '../utils/planning-map-pins';
import {
  estimatedVisitClockMinutes,
  formatPlanningDateKey,
  minutesToClockLabel,
  sortEntryEtaSlices,
  sumEtaMinutes,
  type EntryEtaSlice,
} from '../utils/planning-utils';
import { buildPlanningMapPins } from '../utils/planning-map-pins';

export type { PlanningVisitRow } from '../model/types';
export type { PlanningMapPin } from '../utils/planning-map-pins';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function formatHeaderDate(d: Date): string {
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

export function usePlanning(): {
  visits: PlanningVisitRow[];
  sortedEtaSlices: EntryEtaSlice[];
  completedVisits: number;
  totalVisits: number;
  totalEtaMinutes: number;
  hasPendingSync: boolean;
  isLoading: boolean;
  showSkeleton: boolean;
  headerDateLabel: string;
  pins: PlanningMapPin[];
  refetchPlanning: () => void;
} {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [visits, setVisits] = useState<PlanningVisitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const refetchPlanning = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  const dateKey = useMemo(() => formatPlanningDateKey(new Date()), []);

  useEffect(() => {
    const slowTimer = setTimeout(() => setSlowLoad(true), 300);
    return () => clearTimeout(slowTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (userId === null) {
        setVisits([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const db = await getDb();
        if (__DEV__) {
          await seedDevPlanningIfEmpty(db, userId);
        }
        const mapped = await fetchPlanningVisitsForDate(db, userId, dateKey);

        if (cancelled) return;

        setVisits(mapped);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, dateKey, reloadNonce]);

  const sortedEtaSlices = useMemo(() => {
    const slices: EntryEtaSlice[] = visits.map((v) => ({
      orderIndex: v.orderIndex,
      etaMinutes: v.etaMinutes,
    }));
    return sortEntryEtaSlices(slices);
  }, [visits]);

  const completedVisits = useMemo(
    () => visits.filter((v) => v.status === 'done' || v.status === 'skipped').length,
    [visits],
  );

  const totalEtaMinutes = sumEtaMinutes(visits);

  const hasPendingSync = useMemo(() => visits.some((v) => v.syncedAt === null), [visits]);

  const pins = useMemo(() => buildPlanningMapPins(visits), [visits]);

  const showSkeleton = isLoading && slowLoad;

  const headerDateLabel = useMemo(() => formatHeaderDate(new Date()), []);

  return {
    visits,
    sortedEtaSlices,
    completedVisits,
    totalVisits: visits.length,
    totalEtaMinutes,
    hasPendingSync,
    isLoading,
    showSkeleton,
    headerDateLabel,
    pins,
    refetchPlanning,
  };
}

export function formatVisitClockLabel(
  visit: PlanningVisitRow,
  sortedSlices: EntryEtaSlice[],
  dayStartMinutes?: number,
): string {
  const mins = estimatedVisitClockMinutes(visit.orderIndex, sortedSlices, dayStartMinutes);
  return minutesToClockLabel(mins);
}

export function formatEtaSegmentLabel(etaMinutes: number | null): string | null {
  if (etaMinutes === null) return null;
  return `≈ ${etaMinutes} min`;
}

export function patientDisplayName(v: PlanningVisitRow): string {
  return `${v.patientFirstName} ${v.patientLastName}`.trim();
}
