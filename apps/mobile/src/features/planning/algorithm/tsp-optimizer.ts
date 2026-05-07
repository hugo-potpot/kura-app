import type { PlanningVisitRow } from '../model/types';
import {
  AVERAGE_URBAN_SPEED_KMH,
  DEFAULT_CARE_MINUTES,
  PLANNING_DAY_START_MINUTES,
} from '../utils/planning-utils';
import { type GeoPoint, haversineKm, travelMinutesFromKm } from './haversine';

/** Point géo minimal pour le calcul d’insertion optimale (story 4.4). */
export interface InsertionGeoCoords {
  readonly latitude: number | null;
  readonly longitude: number | null;
}

function insertionDistKm(a: InsertionGeoCoords, b: InsertionGeoCoords): number {
  if (
    a.latitude === null ||
    a.longitude === null ||
    b.latitude === null ||
    b.longitude === null ||
    !Number.isFinite(a.latitude) ||
    !Number.isFinite(a.longitude) ||
    !Number.isFinite(b.latitude) ||
    !Number.isFinite(b.longitude)
  ) {
    return 0;
  }
  return haversineKm(
    { latitude: a.latitude, longitude: a.longitude },
    { latitude: b.latitude, longitude: b.longitude },
  );
}

/**
 * Position d’insertion à coût marginal minimal (dist(prev→new) + dist(new→next) − dist(prev→next)).
 * Patient sans coordonnées : fin de liste (comportement métier 4.4).
 */
export function findOptimalInsertionIndex(
  newPatient: InsertionGeoCoords,
  entries: readonly InsertionGeoCoords[],
): { index: number; costSaving: number } {
  if (
    newPatient.latitude === null ||
    newPatient.longitude === null ||
    !Number.isFinite(newPatient.latitude) ||
    !Number.isFinite(newPatient.longitude)
  ) {
    return { index: entries.length, costSaving: 0 };
  }
  if (entries.length === 0) {
    return { index: 0, costSaving: 0 };
  }

  let bestIndex = 0;
  let bestInsertionCost = Infinity;
  let bestSaving = 0;

  for (let i = 0; i <= entries.length; i += 1) {
    const prev = i > 0 ? entries[i - 1] : undefined;
    const next = i < entries.length ? entries[i] : undefined;
    const distToPrev = prev !== undefined ? insertionDistKm(prev, newPatient) : 0;
    const distToNext = next !== undefined ? insertionDistKm(newPatient, next) : 0;
    const distPrevNext =
      prev !== undefined && next !== undefined ? insertionDistKm(prev, next) : 0;
    const insertionCost = distToPrev + distToNext - distPrevNext;
    if (insertionCost < bestInsertionCost - 1e-9) {
      bestInsertionCost = insertionCost;
      bestIndex = i;
      bestSaving = distPrevNext - distToPrev - distToNext;
    }
  }

  return { index: bestIndex, costSaving: bestSaving };
}

export interface VisitNode {
  readonly entryId: string;
  readonly patientId: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly patientFirstName: string;
  readonly patientLastName: string;
  /** Ancre de stabilité pour patients sans coords (anciens `order_index`). */
  readonly stabilityOrder: number;
}

export interface OptimizedSegment {
  readonly entryId: string;
  readonly orderIndex: number;
  /** `null` pour entrées `skipped` (patient absent). */
  readonly etaMinutes: number | null;
  readonly travelMinutes: number;
  readonly explanationLine: string;
}

function isGeo(v: VisitNode): v is VisitNode & { latitude: number; longitude: number } {
  return v.latitude !== null && v.longitude !== null && Number.isFinite(v.latitude) && Number.isFinite(v.longitude);
}

function centroidOf(points: GeoPoint[]): GeoPoint {
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.latitude;
    lng += p.longitude;
  }
  const n = points.length;
  return { latitude: lat / n, longitude: lng / n };
}

function patientShortLabel(v: VisitNode): string {
  const fn = v.patientFirstName.trim();
  const ln = v.patientLastName.trim();
  if (fn.length > 0 && ln.length > 0) return `${fn} ${ln}`;
  if (fn.length > 0) return fn;
  if (ln.length > 0) return ln;
  return 'patient';
}

function geoPathKm(perm: readonly number[], geo: readonly VisitNode[], start: GeoPoint): number {
  if (perm.length === 0) return 0;
  type GeoVisit = VisitNode & { latitude: number; longitude: number };
  const pts: GeoVisit[] = [];
  for (const ix of perm) {
    const n = geo[ix];
    if (n !== undefined && isGeo(n)) pts.push(n);
  }
  if (pts.length === 0) return 0;
  const head = pts.at(0);
  if (head === undefined) return 0;
  let cost = haversineKm(start, head);
  for (let i = 0; i < pts.length - 1; i++) {
    const from = pts.at(i);
    const to = pts.at(i + 1);
    if (from === undefined || to === undefined) continue;
    cost += haversineKm(from, to);
  }
  return cost;
}

/** 2-opt sur la permutation (`perm` liste d’indices dans `geo`). Borne itérations pour Hermes/NFR perf. */
function twoOptImprove(
  perm: number[],
  geo: readonly VisitNode[],
  start: GeoPoint,
): number[] {
  const maxOuter = 80;
  let current = [...perm];
  let bestKm = geoPathKm(current, geo, start);

  for (let sweep = 0; sweep < maxOuter; sweep += 1) {
    let improved = false;
    for (let i = 0; i < current.length - 1; i += 1) {
      for (let j = i + 2; j < current.length; j += 1) {
        const next = [...current];
        let a = i + 1;
        let b = j;
        while (a < b) {
          const va = next[a];
          const vb = next[b];
          if (va === undefined || vb === undefined) break;
          next[a] = vb;
          next[b] = va;
          a += 1;
          b -= 1;
        }
        const km = geoPathKm(next, geo, start);
        if (km + 1e-9 < bestKm) {
          bestKm = km;
          current = next;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return current;
}

/**
 * Recalcule les segments trajet/soin (`etaMinutes`) pour un ordre de visites déjà fixé (ex. après drag & drop),
 * même logique géographique que la phase finale de `optimizeVisitOrder`.
 */
export function computeEtaSegmentsForVisitOrder(
  orderedVisits: readonly VisitNode[],
): OptimizedSegment[] {
  if (orderedVisits.length === 0) return [];

  const geo = orderedVisits.filter(isGeo);
  if (geo.length === 0) {
    return orderedVisits.map((v, idx) => ({
      entryId: v.entryId,
      orderIndex: idx,
      etaMinutes: DEFAULT_CARE_MINUTES,
      travelMinutes: 0,
      explanationLine:
        'Adresse non géolocalisée — ordre manuel ; trajet non estimé (complétez le GPS).',
    }));
  }

  const start = centroidOf(geo.map((g) => ({ latitude: g.latitude, longitude: g.longitude })));
  let prevGeoPoint: GeoPoint | null = null;
  const out: OptimizedSegment[] = [];
  let cumClock = PLANNING_DAY_START_MINUTES;

  for (let i = 0; i < orderedVisits.length; i += 1) {
    const v = orderedVisits[i]!;
    let travelKm = 0;

    if (isGeo(v)) {
      if (prevGeoPoint === null) {
        travelKm = haversineKm(start, v);
      } else {
        travelKm = haversineKm(prevGeoPoint, v);
      }
      prevGeoPoint = v;
    }

    const travelMin = travelMinutesFromKm(travelKm, AVERAGE_URBAN_SPEED_KMH);
    const etaMinutes = travelMin + DEFAULT_CARE_MINUTES;

    const arrivalBeforeNoon = cumClock < 12 * 60;
    cumClock += etaMinutes;
    const morningHint = arrivalBeforeNoon ? ' • Créneau matin' : '';

    const prev = i > 0 ? orderedVisits[i - 1] : undefined;

    let explanationLine: string;
    if (!isGeo(v)) {
      explanationLine =
        'Adresse non géolocalisée — ordre manuel ; trajet non estimé (complétez le GPS).';
    } else if (prev === undefined || !isGeo(prev)) {
      explanationLine = `Ordre manuel — premier trajet géolocalisé ~${travelMin} min${morningHint}`;
    } else {
      explanationLine = `Après ${patientShortLabel(prev)} — trajet ~${travelMin} min • ordre manuel`;
    }

    out.push({
      entryId: v.entryId,
      orderIndex: i,
      etaMinutes,
      travelMinutes: travelMin,
      explanationLine,
    });
  }

  return out;
}

function nearestNeighborOrder(geo: readonly VisitNode[], start: GeoPoint): number[] {
  const unvisited = new Set<number>(Array.from({ length: geo.length }, (_, i) => i));
  const order: number[] = [];
  let currentPoint: GeoPoint = start;

  while (unvisited.size > 0) {
    let pick: number | null = null;
    let bestKm = Infinity;
    for (const idx of unvisited) {
      const g = geo[idx];
      if (g === undefined || !isGeo(g)) continue;
      const d = haversineKm(currentPoint, g);
      if (pick === null || d < bestKm - 1e-9 || (Math.abs(d - bestKm) < 1e-9 && idx < pick)) {
        bestKm = d;
        pick = idx;
      }
    }
    if (pick === null) break;
    unvisited.delete(pick);
    order.push(pick);
    const gn = geo[pick];
    if (gn !== undefined && isGeo(gn)) currentPoint = gn;
  }
  return order;
}

function sortNoGeoStable(nodes: VisitNode[]): VisitNode[] {
  return [...nodes].sort((a, b) => {
    const ln = a.patientLastName.localeCompare(b.patientLastName, 'fr');
    if (ln !== 0) return ln;
    const fn = a.patientFirstName.localeCompare(b.patientFirstName, 'fr');
    if (fn !== 0) return fn;
    return a.stabilityOrder - b.stabilityOrder;
  });
}

/**
 * Nearest-neighbour depuis le centre géographique des visites, puis 2-opt sur le chemin ouvert.
 * Patients sans coordonnées : fin de tournée, ordre stable (nom + ancien index).
 * `etaMinutes` par entrée = trajet vers le patient + `DEFAULT_CARE_MINUTES` (schéma inchangé).
 */
export function optimizeVisitOrder(visits: readonly VisitNode[]): OptimizedSegment[] {
  if (visits.length === 0) return [];

  const geo = visits.filter(isGeo);
  const noGeo = visits.filter((v) => !isGeo(v));
  const noGeoSorted = sortNoGeoStable(noGeo);

  if (geo.length === 0) {
    return noGeoSorted.map((v, idx) => ({
      entryId: v.entryId,
      orderIndex: idx,
      etaMinutes: DEFAULT_CARE_MINUTES,
      travelMinutes: 0,
      explanationLine:
        'Adresse non géolocalisée — ordre conservé en fin de journée (pas d’optimisation trajet).',
    }));
  }

  const start = centroidOf(geo.map((g) => ({ latitude: g.latitude, longitude: g.longitude })));
  let perm = nearestNeighborOrder(geo, start);
  if (perm.length >= 3) {
    perm = twoOptImprove(perm, geo, start);
  }

  const orderedGeo = perm.flatMap((i) => {
    const nv = geo[i];
    return nv !== undefined ? [nv] : [];
  });
  const fullOrder: VisitNode[] = [...orderedGeo, ...noGeoSorted];

  let prevGeoPoint: GeoPoint | null = null;
  const out: OptimizedSegment[] = [];
  let cumClock = PLANNING_DAY_START_MINUTES;

  for (let i = 0; i < fullOrder.length; i += 1) {
    const v = fullOrder[i]!;
    let travelKm = 0;

    if (isGeo(v)) {
      if (prevGeoPoint === null) {
        travelKm = haversineKm(start, v);
      } else {
        travelKm = haversineKm(prevGeoPoint, v);
      }
      prevGeoPoint = v;
    }

    const travelMin = travelMinutesFromKm(travelKm, AVERAGE_URBAN_SPEED_KMH);
    const etaMinutes = travelMin + DEFAULT_CARE_MINUTES;

    const arrivalBeforeNoon = cumClock < 12 * 60;
    cumClock += etaMinutes;
    const morningHint = arrivalBeforeNoon ? ' • Créneau matin' : '';

    let explanationLine: string;
    const prev = i > 0 ? fullOrder[i - 1] : undefined;

    if (!isGeo(v)) {
      explanationLine =
        'Adresse non géolocalisée — conservé en fin de tournée ; trajet non estimé (complétez le GPS).';
    } else if (prev === undefined || !isGeo(prev)) {
      explanationLine = `Première visite géolocalisée — trajet depuis le centre agrégé ~${travelMin} min${morningHint}`;
    } else {
      explanationLine = `Après ${patientShortLabel(prev)} — trajet estimé ~${travelMin} min${morningHint}`;
    }

    out.push({
      entryId: v.entryId,
      orderIndex: i,
      etaMinutes,
      travelMinutes: travelMin,
      explanationLine,
    });
  }

  return out;
}

function isGeoRow(
  v: PlanningVisitRow,
): v is PlanningVisitRow & { latitude: number; longitude: number } {
  return (
    v.latitude !== null &&
    v.longitude !== null &&
    Number.isFinite(v.latitude) &&
    Number.isFinite(v.longitude)
  );
}

function patientShortLabelFromRow(v: PlanningVisitRow): string {
  const fn = v.patientFirstName.trim();
  const ln = v.patientLastName.trim();
  if (fn.length > 0 && ln.length > 0) return `${fn} ${ln}`;
  if (fn.length > 0) return fn;
  if (ln.length > 0) return ln;
  return 'patient';
}

/**
 * ETA journée en respectant `skipped` (hors chaîne de trajets) et l’ordre courant.
 * `renumberOrderIndex: true` → positions 0…n-1 selon la séquence fournie (réorganisation manuelle).
 */
export function computeEtaSegmentsForPlanningDayOrder(
  visitSequenceInOrder: readonly PlanningVisitRow[],
  options?: { renumberOrderIndex?: boolean },
): OptimizedSegment[] {
  const renumber = options?.renumberOrderIndex ?? false;
  if (visitSequenceInOrder.length === 0) return [];

  const geoForStart: GeoPoint[] = [];
  for (const r of visitSequenceInOrder) {
    if (r.status === 'skipped') continue;
    if (isGeoRow(r)) geoForStart.push({ latitude: r.latitude, longitude: r.longitude });
  }

  const start =
    geoForStart.length > 0
      ? centroidOf(geoForStart)
      : ({ latitude: 0, longitude: 0 } satisfies GeoPoint);

  let prevGeoPoint: GeoPoint | null = null;
  const out: OptimizedSegment[] = [];
  let cumClock = PLANNING_DAY_START_MINUTES;

  for (let i = 0; i < visitSequenceInOrder.length; i += 1) {
    const v = visitSequenceInOrder[i]!;
    const orderIndex = renumber ? i : v.orderIndex;

    if (v.status === 'skipped') {
      out.push({
        entryId: v.entryId,
        orderIndex,
        etaMinutes: null,
        travelMinutes: 0,
        explanationLine: 'Patient absent — hors calcul de trajet.',
      });
      continue;
    }

    let travelKm = 0;
    if (isGeoRow(v)) {
      if (prevGeoPoint === null) {
        travelKm = geoForStart.length > 0 ? haversineKm(start, v) : 0;
      } else {
        travelKm = haversineKm(prevGeoPoint, v);
      }
      prevGeoPoint = { latitude: v.latitude, longitude: v.longitude };
    }

    const travelMin = travelMinutesFromKm(travelKm, AVERAGE_URBAN_SPEED_KMH);
    const etaMinutes = travelMin + DEFAULT_CARE_MINUTES;

    const arrivalBeforeNoon = cumClock < 12 * 60;
    cumClock += etaMinutes;
    const morningHint = arrivalBeforeNoon ? ' • Créneau matin' : '';

    let prevNonSkipped: PlanningVisitRow | undefined;
    for (let j = i - 1; j >= 0; j -= 1) {
      const c = visitSequenceInOrder[j]!;
      if (c.status !== 'skipped') {
        prevNonSkipped = c;
        break;
      }
    }

    let explanationLine: string;
    if (!isGeoRow(v)) {
      explanationLine =
        'Adresse non géolocalisée — ordre manuel ; trajet non estimé (complétez le GPS).';
    } else if (prevNonSkipped === undefined || !isGeoRow(prevNonSkipped)) {
      explanationLine = `Ordre manuel — premier trajet géolocalisé ~${travelMin} min${morningHint}`;
    } else {
      explanationLine = `Après ${patientShortLabelFromRow(prevNonSkipped)} — trajet ~${travelMin} min • ordre manuel`;
    }

    out.push({
      entryId: v.entryId,
      orderIndex,
      etaMinutes,
      travelMinutes: travelMin,
      explanationLine,
    });
  }

  return out;
}
