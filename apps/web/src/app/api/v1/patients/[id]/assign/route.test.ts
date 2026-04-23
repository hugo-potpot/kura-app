import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/db', () => {
  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  return {
    db: {
      select: vi.fn(),
      update: vi.fn(() => updateChain),
    },
  };
});

vi.mock('@kura/db', () => ({
  patientsPg: { id: 'id', structureId: 'structure_id', assignedIdelId: 'assigned_idel_id' },
  authUser: { id: 'id', structureId: 'structure_id', role: 'role' },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PATCH } from './route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'admin', structureId: 'struct-1' } };
const IDEL_SESSION = { user: { id: 'idel-1', role: 'idel', structureId: 'struct-1' } };

const MOCK_PATIENT = {
  id: 'patient-1', structureId: 'struct-1', assignedIdelId: null,
  firstName: 'Marie', lastName: 'Dupont', address: '12 rue de la Paix',
  status: 'active', createdAt: new Date(), updatedAt: new Date(),
};

type RouteParams = { params: Promise<{ id: string }> };
function makeParams(id: string): RouteParams {
  return { params: Promise.resolve({ id }) };
}

function makeSelectOnce(returnValue: unknown) {
  const chain = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(returnValue) };
  vi.mocked(db.select).mockReturnValueOnce(chain as never);
  return chain;
}

describe('PATCH /api/v1/patients/[id]/assign', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 401 si pas de session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: 'idel-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle IDEL (pas admin)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: 'idel-2' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('retourne 400 si body invalide', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: 123 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si IDEL cible introuvable dans la structure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([]); // IDEL not found
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: 'unknown-idel' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('IDEL_NOT_FOUND');
  });

  it('retourne 404 si patient introuvable', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([{ id: 'idel-1' }]); // IDEL found
    makeSelectOnce([]); // patient not found
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: 'idel-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('unknown'));
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('PATIENT_NOT_FOUND');
  });

  it('assigne un patient à un IDEL et retourne 200', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([{ id: 'idel-1' }]); // IDEL found
    makeSelectOnce([MOCK_PATIENT]); // patient found
    const updatedPatient = { ...MOCK_PATIENT, assignedIdelId: 'idel-1' };
    makeSelectOnce([updatedPatient]); // return updated

    const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: 'idel-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patient: { assignedIdelId: string } } };
    expect(body.data.patient.assignedIdelId).toBe('idel-1');
  });

  it('désassigne un patient (idelId: null) et retourne 200', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    // No IDEL lookup when idelId is null
    makeSelectOnce([{ ...MOCK_PATIENT, assignedIdelId: 'idel-1' }]); // patient found
    const updatedPatient = { ...MOCK_PATIENT, assignedIdelId: null };
    makeSelectOnce([updatedPatient]); // return updated

    const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ idelId: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patient: { assignedIdelId: null } } };
    expect(body.data.patient.assignedIdelId).toBeNull();
  });
});
