import { Linking, Platform } from 'react-native';

/**
 * Clé de date stable pour `planning_entries.date` (SQLite TEXT, format ISO date locale machine).
 */
export function formatPlanningDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Premier créneau fictif de la journée en minutes depuis minuit (documenté pour l'UI tant que les créneaux serveur ne sont pas là). */
export const PLANNING_DAY_START_MINUTES = 8 * 60;

export interface EntryEtaSlice {
  orderIndex: number;
  etaMinutes: number | null;
}

/** Options horaires issues des préférences IDEL pour le calcul des heures d'arrivée. */
export interface VisitClockOptions {
  /** Créneau (minutes depuis minuit) à partir duquel la pause déjeuner est insérée. */
  pauseStartMinutes?: number;
  /** Durée de la pause déjeuner en minutes (0 = pas de pause). */
  lunchDurationMinutes?: number;
}

/**
 * Heure estimée d'arrivée : `dayStartMinutes` (défaut 08:00) + cumul des `eta_minutes`
 * des visites précédentes (tri par `order_index`), en insérant la pause déjeuner dès
 * que l'heure d'arrivée atteint `pauseStartMinutes` — exactement comme l'optimiseur de tournée.
 */
export function estimatedVisitClockMinutes(
  entryOrderIndex: number,
  sortedEntries: EntryEtaSlice[],
  dayStartMinutes: number = PLANNING_DAY_START_MINUTES,
  options?: VisitClockOptions,
): number {
  const lunchDurationMinutes = options?.lunchDurationMinutes ?? 0;
  const pauseStartMinutes = options?.pauseStartMinutes ?? Number.POSITIVE_INFINITY;

  let cum = dayStartMinutes;
  let lunchInserted = false;

  for (const e of sortedEntries) {
    // Pause déjeuner insérée avant la visite dont l'arrivée atteint le créneau de pause.
    if (!lunchInserted && lunchDurationMinutes > 0 && cum >= pauseStartMinutes) {
      cum += lunchDurationMinutes;
      lunchInserted = true;
    }
    if (e.orderIndex >= entryOrderIndex) break;
    cum += e.etaMinutes ?? 0;
  }
  return cum;
}

/** Description de la pause déjeuner intercalée dans la tournée, pour l'affichage. */
export interface LunchBreakInfo {
  /** orderIndex de la visite AVANT laquelle la pause s'insère. */
  beforeOrderIndex: number;
  /** Heure de début de la pause (minutes depuis minuit). */
  startMinutes: number;
  /** Durée de la pause en minutes. */
  durationMinutes: number;
}

/**
 * Détermine où la pause déjeuner s'insère dans la tournée — même règle que l'optimiseur :
 * avant la première visite dont l'heure d'arrivée atteint `pauseStartMinutes`.
 * Retourne `null` si pas de pause configurée ou si elle tombe après la dernière visite.
 */
export function computeLunchBreak(
  sortedEntries: EntryEtaSlice[],
  dayStartMinutes: number = PLANNING_DAY_START_MINUTES,
  options?: VisitClockOptions,
): LunchBreakInfo | null {
  const lunchDurationMinutes = options?.lunchDurationMinutes ?? 0;
  const pauseStartMinutes = options?.pauseStartMinutes ?? Number.POSITIVE_INFINITY;
  if (lunchDurationMinutes <= 0) return null;

  let cum = dayStartMinutes;
  for (const e of sortedEntries) {
    if (cum >= pauseStartMinutes) {
      return { beforeOrderIndex: e.orderIndex, startMinutes: cum, durationMinutes: lunchDurationMinutes };
    }
    cum += e.etaMinutes ?? 0;
  }
  return null;
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

/** Durée soin sur place (minutes) tant que le métier n'expose pas de durée patient (schéma évolutif). */
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

/** Ouvre l'app cartes native avec navigation vers la destination.
 *  iOS : préfère le texte d'adresse (affiche le nom de rue dans Plans).
 *  Android : préfère les coordonnées GPS (Google Navigation démarre directement). */
export function openNativeMapsNavigation(
  address: string,
  lat?: number | null,
  lng?: number | null,
): void {
  const cleanAddress = address.trim();
  let url: string;

  if (Platform.OS === 'ios') {
    if (cleanAddress.length > 0) {
      url = 'maps://?daddr=' + encodeURIComponent(cleanAddress);
    } else if (lat != null && lng != null) {
      url = 'maps://?daddr=' + String(lat) + ',' + String(lng);
    } else {
      return;
    }
  } else {
    if (lat != null && lng != null) {
      url = 'google.navigation:q=' + String(lat) + ',' + String(lng);
    } else if (cleanAddress.length > 0) {
      url = 'geo:0,0?q=' + encodeURIComponent(cleanAddress);
    } else {
      return;
    }
  }

  void Linking.openURL(url);
}
