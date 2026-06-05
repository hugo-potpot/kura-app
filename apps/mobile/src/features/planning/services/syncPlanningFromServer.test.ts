import { syncPlanningFromServer } from './syncPlanningFromServer';

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('@kura/db', () => ({
  patients: { id: 'id', structureId: 'structure_id', firstName: 'first_name', lastName: 'last_name', address: 'address', latitude: 'latitude', longitude: 'longitude', status: 'status', createdAt: 'created_at', updatedAt: 'updated_at', syncedAt: 'synced_at' },
  planningEntries: { id: 'id', patientId: 'patient_id', idelId: 'idel_id', date: 'date', orderIndex: 'order_index', status: 'status', etaMinutes: 'eta_minutes', createdAt: 'created_at', updatedAt: 'updated_at', syncedAt: 'synced_at' },
}));

import { apiClient } from '@/lib/api-client';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  transaction: jest.Mock;
};

function makeInsertChain() {
  const onConflict = jest.fn().mockResolvedValue([]);
  const values = jest.fn(() => ({ onConflictDoUpdate: onConflict }));
  return { values, onConflictDoUpdate: onConflict, _values: values };
}

function makeDb(overrides: Partial<MockDb> = {}): MockDb {
  const chain = () => ({ from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue([]) });
  const db: MockDb = {
    select: jest.fn(chain),
    insert: jest.fn(() => makeInsertChain()),
    update: jest.fn(() => ({ set: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue([]) })),
    delete: jest.fn(() => ({ where: jest.fn().mockResolvedValue([]) })),
    transaction: jest.fn(),
    ...overrides,
  };
  if (!overrides.transaction) {
    db.transaction = jest.fn(async (cb: (tx: MockDb) => Promise<void>) => { await cb(db); });
  }
  return db;
}

const DATE = '2026-05-21';

describe('syncPlanningFromServer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ne fait rien si hors ligne (fetch échoue)', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'));
    const db = makeDb();
    await expect(syncPlanningFromServer(db as never, 'idel-1', DATE)).resolves.toBeUndefined();
    expect(db.delete).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('insère les nouvelles entrées serveur et leur patient dans SQLite', async () => {
    const serverEntries = [
      { id: 's-1', patientId: 'p-1', orderIndex: 0, status: 'pending', etaMinutes: 10,
        patient: { id: 'p-1', structureId: 'struct-1', firstName: 'Marie', lastName: 'Dupont', address: '1 rue X', latitude: 48.8, longitude: 2.3 } },
    ];
    mockGet.mockResolvedValueOnce({ data: { data: { date: DATE, entries: serverEntries } } } as never);

    const selectChain = { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue([]) };
    const db = makeDb({ select: jest.fn(() => selectChain) });

    await syncPlanningFromServer(db as never, 'idel-1', DATE);

    // 2 inserts : 1 patient + 1 planning entry
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it('préserve le statut local si la visite est déjà en cours (non-pending)', async () => {
    const serverEntries = [
      { id: 's-1', patientId: 'p-1', orderIndex: 0, status: 'pending', etaMinutes: 10,
        patient: { id: 'p-1', structureId: 'struct-1', firstName: 'Marie', lastName: 'Dupont', address: '1 rue X', latitude: 48.8, longitude: 2.3 } },
    ];
    mockGet.mockResolvedValueOnce({ data: { data: { date: DATE, entries: serverEntries } } } as never);

    const existingLocal = [{ id: 's-1', patientId: 'p-1', idelId: 'idel-1', date: DATE, orderIndex: 0, status: 'in_progress', etaMinutes: null, createdAt: new Date(), updatedAt: new Date(), syncedAt: null }];
    const selectChain = { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue(existingLocal) };
    const updateSet = jest.fn().mockReturnThis();
    const updateWhere = jest.fn().mockResolvedValue([]);
    const db = makeDb({
      select: jest.fn(() => selectChain),
      update: jest.fn(() => ({ set: updateSet, where: updateWhere })),
    });

    await syncPlanningFromServer(db as never, 'idel-1', DATE);

    const setCall = updateSet.mock.calls[0]?.[0] as { status?: string };
    expect(setCall?.status).toBeUndefined();
  });

  it('supprime les entrées pending locales absentes du serveur', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: { date: DATE, entries: [] } } } as never);

    const existingLocal = [{ id: 'local-1', patientId: 'p-99', idelId: 'idel-1', date: DATE, orderIndex: 0, status: 'pending', etaMinutes: null, createdAt: new Date(), updatedAt: new Date(), syncedAt: null }];
    const selectChain = { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue(existingLocal) };
    const deleteWhere = jest.fn().mockResolvedValue([]);
    const db = makeDb({
      select: jest.fn(() => selectChain),
      delete: jest.fn(() => ({ where: deleteWhere })),
    });

    await syncPlanningFromServer(db as never, 'idel-1', DATE);

    expect(deleteWhere).toHaveBeenCalled();
  });
});
