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
  patientsPg: {
    id: 'id',
    structureId: 'structure_id',
    firstName: 'first_name',
    lastName: 'last_name',
    address: 'address',
    latitude: 'latitude',
    longitude: 'longitude',
    phone: 'phone',
    treatingDoctor: 'treating_doctor',
    status: 'status',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    syncedAt: 'synced_at',
  },
}));

vi.mock('@/lib/geocoding', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 48.8566, lng: 2.3522 }),
  geocodeAndUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { geocodeAndUpdate } from '@/lib/geocoding';
import { GET, PATCH } from './route';

const ADMIN_SESSION = {
  user: { id: 'user-1', role: 'admin', structureId: 'struct-1' },
};

const IDEL_SESSION = {
  user: { id: 'user-2', role: 'idel', structureId: 'struct-1' },
};

const DOCTOR_SESSION = {
  user: { id: 'user-3', role: 'doctor', structureId: 'struct-1' },
};

const MOCK_PATIENT = {
  id: 'patient-1',
  structureId: 'struct-1',
  firstName: 'Marie',
  lastName: 'Dupont',
  address: '12 rue de la Paix, Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  phone: null,
  treatingDoctor: 'Dr. Martin',
  assignedIdelId: 'user-2', // assigned to IDEL user-2
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  syncedAt: null,
};

type RouteParams = { params: Promise<{ id: string }> };

function makeParams(id: string): RouteParams {
  return { params: Promise.resolve({ id }) };
}

function makeSelectOnce(returnValue: unknown) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(returnValue),
  };
  vi.mocked(db.select).mockReturnValueOnce(chain as never);
  return chain;
}

describe('GET /api/v1/patients/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 401 si pas de session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('retourne 403 si pas de structureId', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'u', role: 'idel', structureId: null },
    } as never);
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('NO_STRUCTURE');
  });

  it('retourne 404 si patient introuvable ou mauvaise structure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([]);
    const res = await GET(new Request('http://localhost'), makeParams('unknown'));
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('PATIENT_NOT_FOUND');
  });

  it('retourne 200 avec le patient pour un admin', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([MOCK_PATIENT]);
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patient: { id: string } } };
    expect(body.data.patient.id).toBe('patient-1');
  });

  it('retourne 200 avec le patient pour un doctor (lecture seule autorisée)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(DOCTOR_SESSION as never);
    makeSelectOnce([MOCK_PATIENT]);
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patient: { id: string } } };
    expect(body.data.patient.id).toBe('patient-1');
  });

  it('retourne 200 avec le patient pour un IDEL assigné', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    makeSelectOnce([MOCK_PATIENT]); // MOCK_PATIENT.assignedIdelId === 'user-2' === IDEL_SESSION.user.id
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(200);
  });

  it('retourne 403 si IDEL tente d\'accéder à un patient non assigné', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    const patientAssignedToOther = { ...MOCK_PATIENT, assignedIdelId: 'other-idel-id' };
    makeSelectOnce([patientAssignedToOther]);
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

describe('PATCH /api/v1/patients/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 401 si pas de session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'Jean' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle doctor', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(DOCTOR_SESSION as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'Jean' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('retourne 400 si body vide', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retourne 404 si patient introuvable', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([]);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'Jean' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('unknown'));
    expect(res.status).toBe(404);
  });

  it('met à jour le patient et retourne 200', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([MOCK_PATIENT]);
    const updatedPatient = { ...MOCK_PATIENT, firstName: 'Jean' };
    makeSelectOnce([updatedPatient]);

    const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'Jean' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patient: { firstName: string } } };
    expect(body.data.patient.firstName).toBe('Jean');
  });

  it('déclenche le géocodage si l\'adresse a changé', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([MOCK_PATIENT]);
    const updatedPatient = { ...MOCK_PATIENT, address: '5 avenue Foch, Lyon', latitude: null, longitude: null };
    makeSelectOnce([updatedPatient]);

    const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ address: '5 avenue Foch, Lyon' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(200);
    expect(vi.mocked(geocodeAndUpdate)).toHaveBeenCalledWith('patient-1', '5 avenue Foch, Lyon');
  });

  it('ne déclenche pas le géocodage si l\'adresse n\'a pas changé', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectOnce([MOCK_PATIENT]);
    const updatedPatient = { ...MOCK_PATIENT, phone: '0612345678' };
    makeSelectOnce([updatedPatient]);

    const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '0612345678' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('patient-1'));
    expect(res.status).toBe(200);
    expect(vi.mocked(geocodeAndUpdate)).not.toHaveBeenCalled();
  });
});