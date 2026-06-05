import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const txMock = { update: vi.fn() };
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock)),
  },
}));

vi.mock('@kura/db', () => ({
  patientsPg: {
    id: 'id',
    structureId: 'structure_id',
    assignedIdelId: 'assigned_idel_id',
    status: 'status',
    firstName: 'first_name',
    lastName: 'last_name',
    address: 'address',
    latitude: 'latitude',
    longitude: 'longitude',
  },
  planningEntriesPg: {
    id: 'id',
    patientId: 'patient_id',
    idelId: 'idel_id',
    date: 'date',
    orderIndex: 'order_index',
    status: 'status',
    etaMinutes: 'eta_minutes',
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { GET, PATCH } from './route';

const IDEL_SESSION = {
  user: { id: 'idel-1', role: 'idel', structureId: 'struct-1' },
};
const NO_SESSION = null;

function makeSelectSequence(...returnValues: unknown[]) {
  let idx = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const val = returnValues[idx++] ?? [];
    return {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(val),
    } as never;
  });
}

describe('GET /api/v1/planning', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(NO_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/planning');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne le planning du jour avec infos patients', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);

    const rows = [
      {
        entry: { id: 'e-1', patientId: 'p-1', idelId: 'idel-1', date: '2026-05-21', orderIndex: 0, status: 'pending', etaMinutes: 12 },
        patient: { id: 'p-1', structureId: 'struct-1', firstName: 'Marie', lastName: 'Dupont', address: '1 rue X', latitude: 48.8, longitude: 2.3 },
      },
      {
        entry: { id: 'e-2', patientId: 'p-2', idelId: 'idel-1', date: '2026-05-21', orderIndex: 1, status: 'pending', etaMinutes: null },
        patient: { id: 'p-2', structureId: 'struct-1', firstName: 'Jean', lastName: 'Martin', address: '2 rue Y', latitude: null, longitude: null },
      },
    ];
    makeSelectSequence(rows);

    const req = new NextRequest('http://localhost/api/v1/planning');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json() as { data: { entries: unknown[]; date: string } };
    expect(body.data.entries).toHaveLength(2);
    expect(body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('retourne un tableau vide si aucune entrée', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    makeSelectSequence([]);

    const req = new NextRequest('http://localhost/api/v1/planning');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json() as { data: { entries: unknown[] } };
    expect(body.data.entries).toHaveLength(0);
  });

  it('accepte un paramètre ?date= pour une date spécifique', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    makeSelectSequence([]);

    const req = new NextRequest('http://localhost/api/v1/planning?date=2026-06-01');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json() as { data: { date: string } };
    expect(body.data.date).toBe('2026-06-01');
  });

  it('retourne 400 si date invalide', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);

    const req = new NextRequest('http://localhost/api/v1/planning?date=not-a-date');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/planning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(txMock.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    } as never);
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(NO_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/planning', {
      method: 'PATCH',
      body: JSON.stringify({ entries: [{ id: 'e-1', status: 'done' }] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si body invalide', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/planning', {
      method: 'PATCH',
      body: JSON.stringify({ entries: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('met à jour les statuts des entrées appartenant à l\'IDEL', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);

    // db.select retourne les entrées existantes de cet IDEL
    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'e-1' }, { id: 'e-2' }]),
    } as never));

    const req = new NextRequest('http://localhost/api/v1/planning', {
      method: 'PATCH',
      body: JSON.stringify({
        entries: [
          { id: 'e-1', status: 'done' },
          { id: 'e-2', status: 'skipped' },
          { id: 'e-other', status: 'done' }, // n'appartient pas à cet IDEL → ignoré
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json() as { data: { updated: number } };
    expect(body.data.updated).toBe(2); // e-other ignoré
  });
});
