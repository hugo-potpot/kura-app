import type { PlanningVisitRow } from '../model/types';
import { globalInsertPosFromActiveIndex } from './urgencyInsertPosition';

function row(
  e: Partial<PlanningVisitRow> & Pick<PlanningVisitRow, 'entryId' | 'orderIndex' | 'status'>,
): PlanningVisitRow {
  return {
    patientId: 'p',
    etaMinutes: null,
    patientFirstName: 'A',
    patientLastName: 'B',
    addressShort: 'r',
    addressFull: 'r',
    latitude: null,
    longitude: null,
    syncedAt: null,
    ...e,
  };
}

describe('globalInsertPosFromActiveIndex', () => {
  const sorted: PlanningVisitRow[] = [
    row({ entryId: '1', orderIndex: 0, status: 'pending' }),
    row({ entryId: '2', orderIndex: 1, status: 'skipped' }),
    row({ entryId: '3', orderIndex: 2, status: 'pending' }),
  ];

  it('inserts at position before first active when activeInsertIndex is 0', () => {
    expect(globalInsertPosFromActiveIndex(sorted, 0)).toBe(0);
  });

  it('inserts after first active when activeInsertIndex is 1', () => {
    expect(globalInsertPosFromActiveIndex(sorted, 1)).toBe(1);
  });

  it('inserts at end when activeInsertIndex >= active count', () => {
    expect(globalInsertPosFromActiveIndex(sorted, 10)).toBe(sorted.length);
  });
});
