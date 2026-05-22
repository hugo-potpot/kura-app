jest.mock('../lib/fetchPlanningRows', () => ({
  fetchPlanningVisitsForDate: jest.fn(),
}));

jest.mock('./persistManualPlanningOrder', () => ({
  persistManualPlanningOrder: jest.fn().mockResolvedValue(undefined),
}));

import { fetchPlanningVisitsForDate } from '../lib/fetchPlanningRows';
import { persistManualPlanningOrder } from './persistManualPlanningOrder';
import { optimizeDailyPlanning } from './optimizeDailyPlanning';
import type { PlanningVisitRow } from '../model/types';

function makeRow(
  entryId: string,
  status: PlanningVisitRow['status'],
  orderIndex: number,
  lat: number,
  lng: number,
): PlanningVisitRow {
  return {
    entryId,
    patientId: `p-${entryId}`,
    orderIndex,
    status,
    etaMinutes: 30,
    patientFirstName: 'Test',
    patientLastName: entryId,
    addressShort: `${entryId} rue`,
    addressFull: `${entryId} rue, Ville`,
    latitude: lat,
    longitude: lng,
    syncedAt: new Date(),
  };
}

const FAKE_DB = {} as never;

describe('optimizeDailyPlanning — visites done fixées en tête', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('les visites done restent en tête et ne sont pas réordonnancées', async () => {
    const patient1Done = makeRow('p1', 'done', 0, 48.85, 2.35);
    const patient2Pending = makeRow('p2', 'pending', 1, 48.86, 2.36);

    // fetchPlanningVisitsForDate appelé 2 fois (optimisation + refresh)
    (fetchPlanningVisitsForDate as jest.Mock)
      .mockResolvedValueOnce([patient1Done, patient2Pending])
      .mockResolvedValueOnce([patient1Done, patient2Pending]);

    await optimizeDailyPlanning(FAKE_DB, 'idel-1', '2026-05-22');

    expect(persistManualPlanningOrder).toHaveBeenCalledTimes(1);
    const [, , , orderedIds] = (persistManualPlanningOrder as jest.Mock).mock.calls[0] as [
      unknown, string, string, string[]
    ];

    // Patient 1 (done) doit être en première position
    expect(orderedIds[0]).toBe('p1');
    // Patient 2 (pending) doit être après
    expect(orderedIds[1]).toBe('p2');
  });

  it('si tout est done, aucune optimisation, ordre préservé', async () => {
    const p1 = makeRow('p1', 'done', 0, 48.85, 2.35);
    const p2 = makeRow('p2', 'done', 1, 48.86, 2.36);

    (fetchPlanningVisitsForDate as jest.Mock)
      .mockResolvedValueOnce([p1, p2])
      .mockResolvedValueOnce([p1, p2]);

    await optimizeDailyPlanning(FAKE_DB, 'idel-1', '2026-05-22');

    const [, , , orderedIds] = (persistManualPlanningOrder as jest.Mock).mock.calls[0] as [
      unknown, string, string, string[]
    ];
    expect(orderedIds).toEqual(['p1', 'p2']);
  });

  it('ordre final : done → pending optimisés → skipped', async () => {
    const pDone = makeRow('done1', 'done', 0, 48.85, 2.35);
    const pPending = makeRow('pend1', 'pending', 1, 48.86, 2.36);
    const pSkipped = makeRow('skip1', 'skipped', 2, 48.84, 2.34);

    (fetchPlanningVisitsForDate as jest.Mock)
      .mockResolvedValueOnce([pDone, pPending, pSkipped])
      .mockResolvedValueOnce([pDone, pPending, pSkipped]);

    await optimizeDailyPlanning(FAKE_DB, 'idel-1', '2026-05-22');

    const [, , , orderedIds] = (persistManualPlanningOrder as jest.Mock).mock.calls[0] as [
      unknown, string, string, string[]
    ];
    expect(orderedIds[0]).toBe('done1');
    expect(orderedIds[orderedIds.length - 1]).toBe('skip1');
  });
});
