import { DEFAULT_CARE_MINUTES } from '../utils/planning-utils';
import { computeEtaSegmentsForVisitOrder, optimizeVisitOrder, type VisitNode } from './tsp-optimizer';

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
