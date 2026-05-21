import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/db', () => {
  const deleteChain = { where: vi.fn().mockResolvedValue([]) };
  const insertChain = { values: vi.fn().mockResolvedValue([]) };
  return {
    db: {
      select: vi.fn(),
      delete: vi.fn(() => deleteChain),
      insert: vi.fn(() => insertChain),
    },
  };
});

vi.mock('@kura/db', () => ({
  patientsPg: {
    id: 'id',
    structureId: 'structure_id',
    assignedIdelId: 'assigned_idel_id',
    status: 'status',
    firstName: 'first_name',
    lastName: 'last_name',
    address: 'address',
  },
  planningEntriesPg: {
    id: 'id',
    patientId: 'patient_id',
    idelId: 'idel_id',
    date: 'date',
    orderIndex: 'order_index',
    status: 'status',
  },
  authUser: {
    id: 'id',
    structureId: 'structure_id',
    role: 'role',
    name: 'name',
  },
}));

vi.mock('@kura/shared', () => ({
  generateId: vi.fn(() => 'new-entry-id'),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { GET, PUT } from './route';

const ADMIN_SESSION = {
  user: { id: 'admin-1', role: 'admin', structureId: 'struct-1' },
};
const NON_ADMIN_SESSION = {
  user: { id: 'user-2', role: 'idel', structureId: 'struct-1' },
};

function makeSelectSequence(...returnValues: unknown[]) {
  let idx = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const val = returnValues[idx++] ?? [];
    return {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(val),
      innerJoin: vi.fn().mockReturnThis(),
    } as never;
  });
}

const PARAMS = Promise.resolve({ idelId: 'idel-1' });

describe('GET /api/v1/admin/idels/[idelId]/planning', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 403 si non admin', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(NON_ADMIN_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/admin/idels/idel-1/planning');
    const res = await GET(req, { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('retourne 403 si IDEL hors structure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    // IDEL pas dans la structure
    makeSelectSequence([], [], []);
    const req = new NextRequest('http://localhost/api/v1/admin/idels/idel-1/planning');
    const res = await GET(req, { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('retourne les patients et le planning du jour', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const idelUser = [{ id: 'idel-1', name: 'Sophie Martin', structureId: 'struct-1', role: 'idel' }];
    const patients = [
      { id: 'p-1', firstName: 'Marie', lastName: 'Dupont', address: '1 rue X', assignedIdelId: 'idel-1' },
      { id: 'p-2', firstName: 'Jean', lastName: 'Martin', address: '2 rue Y', assignedIdelId: 'idel-1' },
    ];
    const planning = [
      { id: 'e-1', patientId: 'p-1', idelId: 'idel-1', date: '2026-05-21', orderIndex: 0, status: 'pending' },
    ];
    makeSelectSequence(idelUser, patients, planning);

    const req = new NextRequest('http://localhost/api/v1/admin/idels/idel-1/planning');
    const res = await GET(req, { params: PARAMS });
    expect(res.status).toBe(200);

    const body = await res.json() as {
      data: { idel: { id: string }; patients: { id: string }[]; planning: { patientId: string }[] }
    };
    expect(body.data.idel.id).toBe('idel-1');
    expect(body.data.patients).toHaveLength(2);
    expect(body.data.planning).toHaveLength(1);
  });
});

describe('PUT /api/v1/admin/idels/[idelId]/planning', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 403 si non admin', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(NON_ADMIN_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/admin/idels/idel-1/planning', {
      method: 'PUT',
      body: JSON.stringify({ date: '2026-05-21', entries: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it('retourne 400 si body invalide', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const idelUser = [{ id: 'idel-1', name: 'Sophie', structureId: 'struct-1', role: 'idel' }];
    makeSelectSequence(idelUser);
    const req = new NextRequest('http://localhost/api/v1/admin/idels/idel-1/planning', {
      method: 'PUT',
      body: JSON.stringify({ date: 'invalid-date', entries: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it('sauvegarde le planning avec succès (200)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const idelUser = [{ id: 'idel-1', name: 'Sophie', structureId: 'struct-1', role: 'idel' }];
    makeSelectSequence(idelUser);

    const req = new NextRequest('http://localhost/api/v1/admin/idels/idel-1/planning', {
      method: 'PUT',
      body: JSON.stringify({
        date: '2026-05-21',
        entries: [
          { patientId: 'p-1', orderIndex: 0 },
          { patientId: 'p-2', orderIndex: 1 },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { saved: number } };
    expect(body.data.saved).toBe(2);
  });
});
