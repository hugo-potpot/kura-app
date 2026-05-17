import type { PlanningVisitRow } from '@/features/planning/model/types';

import { buildPlanningMapPins, pinColorForStatus } from './planning-map-pins';

function row(partial: Partial<PlanningVisitRow> & Pick<PlanningVisitRow, 'entryId' | 'orderIndex'>): PlanningVisitRow {
  return {
    patientId: 'p1',
    status: 'pending',
    etaMinutes: 10,
    patientFirstName: 'A',
    patientLastName: 'B',
    addressShort: 'x',
    addressFull: 'addr',
    latitude: 48.85,
    longitude: 2.35,
    syncedAt: null,
    ...partial,
  };
}

describe('planning-map-pins', () => {
  it('pinColorForStatus renvoie indigo, vert ou orange selon le statut', () => {
    expect(pinColorForStatus('pending')).toBe('#3949AB');
    expect(pinColorForStatus('in_progress')).toBe('#3949AB');
    expect(pinColorForStatus('done')).toBe('#2E7D32');
    expect(pinColorForStatus('skipped')).toBe('#FB8C00');
  });

  it('buildPlanningMapPins inclut les skipped géolocalisés et exclut sans coords', () => {
    const visits: PlanningVisitRow[] = [
      row({ entryId: 'a', orderIndex: 1, status: 'skipped' }),
      row({ entryId: 'b', orderIndex: 0, status: 'pending' }),
      row({
        entryId: 'c',
        orderIndex: 2,
        status: 'done',
        latitude: null,
        longitude: null,
      }),
    ];
    const pins = buildPlanningMapPins(visits);
    expect(pins.map((p) => p.entryId)).toEqual(['b', 'a']);
    expect(pins.find((p) => p.entryId === 'a')?.status).toBe('skipped');
    expect(pins.some((p) => p.entryId === 'c')).toBe(false);
  });

  it('buildPlanningMapPins trie par order_index', () => {
    const visits: PlanningVisitRow[] = [
      row({ entryId: 'z', orderIndex: 2 }),
      row({ entryId: 'y', orderIndex: 0 }),
      row({ entryId: 'x', orderIndex: 1 }),
    ];
    expect(buildPlanningMapPins(visits).map((p) => p.orderIndex)).toEqual([0, 1, 2]);
  });
});
