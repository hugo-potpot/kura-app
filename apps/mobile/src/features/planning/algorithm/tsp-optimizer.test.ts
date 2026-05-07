import { DEFAULT_CARE_MINUTES } from '../utils/planning-utils';
import type { PlanningVisitRow } from '../model/types';
import {
  computeEtaSegmentsForPlanningDayOrder,
  computeEtaSegmentsForVisitOrder,
  findOptimalInsertionIndex,
  optimizeVisitOrder,
  type VisitNode,
} from './tsp-optimizer';

function visitRow(
  partial: Partial<PlanningVisitRow> & Pick<PlanningVisitRow, 'entryId' | 'orderIndex' | 'status'>,
): PlanningVisitRow {
  return {
    patientId: `p-${partial.entryId}`,
    etaMinutes: 30,
    patientFirstName: 'Jean',
    patientLastName: 'Dupont',
    addressShort: 'Rue',
    addressFull: 'Rue 1',
    latitude: 45.0,
    longitude: 4.0,
    syncedAt: null,
    ...partial,
  };
}

function node(
  id: string,
  lat: number | null,
  lng: number | null,
  first: string,
  last: string,
  stability: number,
): VisitNode {
  return {
    entryId: id,
    patientId: `p-${id}`,
    latitude: lat,
    longitude: lng,
    patientFirstName: first,
    patientLastName: last,
    stabilityOrder: stability,
  };
}

describe('optimizeVisitOrder', () => {
  it('should return empty for 0 patients', () => {
    expect(optimizeVisitOrder([])).toEqual([]);
  });

  it('should keep a single geolocated patient with segment = travel + care', () => {
    const out1 = optimizeVisitOrder([node('a', 45.764, 4.8357, 'A', 'Un', 0)]);
    expect(out1).toHaveLength(1);
    const seg = out1[0];
    if (seg === undefined) throw new Error('expected one segment');
    expect(seg.orderIndex).toBe(0);
    expect(seg.etaMinutes).toBeGreaterThanOrEqual(DEFAULT_CARE_MINUTES);
    expect(seg.explanationLine.length).toBeGreaterThan(8);
  });

  it('should place non-geocoded visits at the end with stable ordering by last name', () => {
    const input: VisitNode[] = [
      node('g', 45.764, 4.8357, 'Geo', 'Patient', 0),
      node('n2', null, null, 'Zorro', 'Nogps', 1),
      node('n1', null, null, 'Alpha', 'Nogps', 2),
    ];
    const out = optimizeVisitOrder(input);
    expect(out[out.length - 2]?.entryId).toBe('n1');
    expect(out[out.length - 1]?.entryId).toBe('n2');
  });

  it('should complete 15 localized patients quickly (soft perf)', () => {
    const pts: VisitNode[] = [];
    for (let i = 0; i < 15; i += 1) {
      const lat = 45.75 + i * 0.002;
      const lng = 4.83 + i * 0.001;
      pts.push(node(`e${i}`, lat, lng, 'P', `${i}`, i));
    }
    const t0 = Date.now();
    const out = optimizeVisitOrder(pts);
    const elapsed = Date.now() - t0;
    expect(out).toHaveLength(15);
    expect(elapsed).toBeLessThan(5000);
  });

  it('should return a sane tour for three nearby points without duplicate entries', () => {
    const a = node('a', 45.0, 4.0, 'A', 'A', 0);
    const b = node('b', 45.01, 4.0, 'B', 'B', 1);
    const c = node('c', 45.02, 4.0001, 'C', 'C', 2);
    const out = optimizeVisitOrder([a, b, c]);
    expect(out).toHaveLength(3);
    expect(new Set(out.map((s) => s.entryId)).size).toBe(3);
  });
});

describe('computeEtaSegmentsForVisitOrder', () => {
  it('should apply user order and renumber orderIndex 0..n-1', () => {
    const a = node('a', 45.0, 4.0, 'A', 'A', 0);
    const b = node('b', 45.02, 4.0, 'B', 'B', 1);
    const out = computeEtaSegmentsForVisitOrder([b, a]);
    expect(out.map((s) => s.entryId)).toEqual(['b', 'a']);
    expect(out.map((s) => s.orderIndex)).toEqual([0, 1]);
    expect(out[0]?.etaMinutes).toBeGreaterThanOrEqual(DEFAULT_CARE_MINUTES);
  });
});

describe('findOptimalInsertionIndex', () => {
  it('should return end index when new patient has no coordinates', () => {
    const entries = [{ latitude: 45, longitude: 4 } as const];
    const r = findOptimalInsertionIndex({ latitude: null, longitude: null }, entries);
    expect(r.index).toBe(1);
    expect(r.costSaving).toBe(0);
  });

  it('should return 0 for empty entries', () => {
    const r = findOptimalInsertionIndex({ latitude: 45.75, longitude: 4.83 }, []);
    expect(r.index).toBe(0);
  });

  it('should prefer a position among 5 geolocated points', () => {
    const entries = [
      { latitude: 45.0, longitude: 4.0 },
      { latitude: 45.02, longitude: 4.0 },
      { latitude: 45.04, longitude: 4.0 },
      { latitude: 45.06, longitude: 4.0 },
      { latitude: 45.08, longitude: 4.0 },
    ];
    const r = findOptimalInsertionIndex({ latitude: 45.03, longitude: 4.0 }, entries);
    expect(r.index).toBeGreaterThanOrEqual(0);
    expect(r.index).toBeLessThanOrEqual(entries.length);
  });
});

describe('computeEtaSegmentsForPlanningDayOrder', () => {
  it('should set etaMinutes null for skipped and preserve orderIndex when not renumbering', () => {
    const seq: PlanningVisitRow[] = [
      visitRow({ entryId: 'a', orderIndex: 0, status: 'pending' }),
      visitRow({
        entryId: 'b',
        orderIndex: 1,
        status: 'skipped',
        latitude: 45.01,
        longitude: 4.0,
      }),
      visitRow({ entryId: 'c', orderIndex: 2, status: 'pending', latitude: 45.02, longitude: 4.0 }),
    ];
    const out = computeEtaSegmentsForPlanningDayOrder(seq, { renumberOrderIndex: false });
    expect(out.find((s) => s.entryId === 'b')?.etaMinutes).toBeNull();
    expect(out.find((s) => s.entryId === 'a')?.orderIndex).toBe(0);
    expect(out.find((s) => s.entryId === 'c')?.etaMinutes).not.toBeNull();
  });

  it('should renumber orderIndex 0..n-1 when renumberOrderIndex is true', () => {
    const seq: PlanningVisitRow[] = [
      visitRow({ entryId: 'x', orderIndex: 5, status: 'pending' }),
      visitRow({ entryId: 'y', orderIndex: 2, status: 'pending', latitude: 45.02, longitude: 4.0 }),
    ];
    const out = computeEtaSegmentsForPlanningDayOrder(seq, { renumberOrderIndex: true });
    expect(out.map((s) => s.orderIndex).sort((a, b) => a - b)).toEqual([0, 1]);
  });
});
