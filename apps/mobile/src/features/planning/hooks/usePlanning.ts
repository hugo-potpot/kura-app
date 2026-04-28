import { useEffect, useMemo, useState } from 'react';
import { and, asc, eq } from 'drizzle-orm';

import { patients, planningEntries } from '@kura/db';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getDb } from '@/lib/db';

import { seedDevPlanningIfEmpty } from '../lib/devPlanningSeed';
import {
  estimatedVisitClockMinutes,
  formatPlanningDateKey,
  minutesToClockLabel,
  shortenAddress,
  sortEntryEtaSlices,
  sumEtaMinutes,
  type PlanningEntryStatus,
} from '../utils/planning-utils';

export interface PlanningVisitRow {
  entryId: string;
  patientId: string;
  orderIndex: number;
  status: PlanningEntryStatus;
  etaMinutes: number | null;
  patientFirstName: string;
  patientLastName: string;
  addressShort: string;
  latitude: number | null;
  longitude: number | null;
  syncedAt: Date | null;
}

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

export interface PlanningMapPin {
  orderIndex: number;
  latitude: number;
  longitude: number;
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
} {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [visits, setVisits] = useState<PlanningVisitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);

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
        const rows = await db
          .select({
            entry: planningEntries,
            patient: patients,
          })
          .from(planningEntries)
          .innerJoin(patients, eq(planningEntries.patientId, patients.id))
          .where(and(eq(planningEntries.idelId, userId), eq(planningEntries.date, dateKey)))
          .orderBy(asc(planningEntries.orderIndex));

        if (cancelled) return;

        const mapped: PlanningVisitRow[] = rows.map((r) => ({
          entryId: r.entry.id,
          patientId: r.patient.id,
          orderIndex: r.entry.orderIndex,
          status: r.entry.status as PlanningEntryStatus,
          etaMinutes: r.entry.etaMinutes,
          patientFirstName: r.patient.firstName,
          patientLastName: r.patient.lastName,
          addressShort: shortenAddress(r.patient.address),
          latitude: r.patient.latitude,
          longitude: r.patient.longitude,
          syncedAt: r.entry.syncedAt,
        }));

        setVisits(mapped);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, dateKey]);

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

  const pins = useMemo(() => {
    const out: PlanningMapPin[] = [];
    for (const v of visits) {
      if (v.latitude !== null && v.longitude !== null) {
        out.push({
          orderIndex: v.orderIndex,
          latitude: v.latitude,
          longitude: v.longitude,
        });
      }
    }
    return sortEntryEtaSlices(out);
  }, [visits]);

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
  };
}

export function formatVisitClockLabel(
  visit: PlanningVisitRow,
  sortedSlices: EntryEtaSlice[],
): string {
  const mins = estimatedVisitClockMinutes(visit.orderIndex, sortedSlices);
  return minutesToClockLabel(mins);
}

export function formatEtaSegmentLabel(etaMinutes: number | null): string | null {
  if (etaMinutes === null) return null;
  return `≈ ${etaMinutes} min`;
}

export function patientDisplayName(v: PlanningVisitRow): string {
  return `${v.patientFirstName} ${v.patientLastName}`.trim();
}
