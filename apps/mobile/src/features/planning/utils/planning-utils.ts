/**
 * Clé de date stable pour `planning_entries.date` (SQLite TEXT, format ISO date locale machine).
 */
export function formatPlanningDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Premier créneau fictif de la journée en minutes depuis minuit (documenté pour l’UI tant que les créneaux serveur ne sont pas là). */
export const PLANNING_DAY_START_MINUTES = 8 * 60;

export interface EntryEtaSlice {
  orderIndex: number;
  etaMinutes: number | null;
}

/**
 * Heure estimée d’arrivée : 08:00 locale + somme des `eta_minutes` des entrées strictly avant cette ligne (tri par `order_index`).
 */
export function estimatedVisitClockMinutes(
  entryOrderIndex: number,
  sortedEntries: EntryEtaSlice[],
): number {
  let cum = 0;
  for (const e of sortedEntries) {
    if (e.orderIndex >= entryOrderIndex) break;
    cum += e.etaMinutes ?? 0;
  }
  return PLANNING_DAY_START_MINUTES + cum;
}

export function minutesToClockLabel(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function sumEtaMinutes(entries: readonly { etaMinutes: number | null }[]): number {
  return entries.reduce((s, e) => s + (e.etaMinutes ?? 0), 0);
}

export const DEFAULT_CARE_TYPE_LABEL = 'Soins';

/** Durée soin sur place (minutes) tant que le métier n’expose pas de durée patient (schéma évolutif). */
export const DEFAULT_CARE_MINUTES = 30;

/** Vitesse moyenne trajets urbains (km/h) — NN+2-opt transforme km → minutes de trajet. */
export const AVERAGE_URBAN_SPEED_KMH = 25;

export type PlanningEntryStatus = 'pending' | 'in_progress' | 'done' | 'skipped';

export function sortEntryEtaSlices<T extends EntryEtaSlice>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function shortenAddress(address: string, maxLen = 42): string {
  const t = address.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}
