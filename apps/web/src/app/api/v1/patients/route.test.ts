import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/db', () => {
  const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
  return {
    db: {
      insert: vi.fn(),
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
  },
}));

vi.mock('@kura/shared', () => ({
  generateId: vi.fn(() => 'generated-id-123'),
}));

vi.mock('@/lib/geocoding', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 48.8566, lng: 2.3522 }),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { POST, GET } from './route';

const ADMIN_SESSION = {
  user: { id: 'user-1', role: 'admin', structureId: 'struct-1' },
};

const IDEL_SESSION = {
  user: { id: 'user-2', role: 'idel', structureId: 'struct-1' },
};

const DOCTOR_SESSION = {
  user: { id: 'user-3', role: 'doctor', structureId: 'struct-1' },
};

function makeInsertMock(returnValue: unknown) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returnValue),
  };
  vi.mocked(db.insert).mockReturnValue(chain as never);
  return chain;
}

function makeSelectMock(returnValue: unknown) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(returnValue),
  };
  vi.mocked(db.select).mockReturnValue(chain as never);
  return chain;
}

describe('POST /api/v1/patients', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 401 si pas de session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const req = new NextRequest('http://localhost/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Marie', lastName: 'Dupont', address: '12 rue de la Paix, Paris' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('retourne 403 si rôle doctor', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(DOCTOR_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Marie', lastName: 'Dupont', address: '12 rue de la Paix, Paris' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('retourne 400 si champs invalides', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const req = new NextRequest('http://localhost/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({ firstName: '', lastName: 'Dupont', address: 'ab' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('crée un patient et retourne 201 (admin)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const mockPatient = {
      id: 'generated-id-123',
      structureId: 'struct-1',
      firstName: 'Marie',
      lastName: 'Dupont',
      address: '12 rue de la Paix, Paris',
      latitude: null,
      longitude: null,
      phone: null,
      treatingDoctor: null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
    };
    makeInsertMock([mockPatient]);
    const req = new NextRequest('http://localhost/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Marie', lastName: 'Dupont', address: '12 rue de la Paix, Paris' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json() as { data: { patient: { id: string } } };
    expect(body.data.patient.id).toBe('generated-id-123');
  });

  it('crée un patient et retourne 201 (idel)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    const mockPatient = {
      id: 'generated-id-123',
      structureId: 'struct-1',
      firstName: 'Jean',
      lastName: 'Martin',
      address: '5 avenue Foch, Lyon',
      latitude: null,
      longitude: null,
      phone: '0612345678',
      treatingDoctor: 'Dr. Bernard',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
    };
    makeInsertMock([mockPatient]);
    const req = new NextRequest('http://localhost/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Jean',
        lastName: 'Martin',
        address: '5 avenue Foch, Lyon',
        phone: '0612345678',
        treatingDoctor: 'Dr. Bernard',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/patients', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne 401 si pas de session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne la liste de tous les patients pour un admin', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    const mockPatients = [
      { id: 'p-1', firstName: 'Marie', lastName: 'Dupont', status: 'active', structureId: 'struct-1' },
      { id: 'p-2', firstName: 'Jean', lastName: 'Martin', status: 'archived', structureId: 'struct-1' },
    ];
    makeSelectMock(mockPatients);
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patients: { id: string }[] } };
    expect(body.data.patients).toHaveLength(2);
  });

  it('retourne 200 pour un doctor (lecture seule, tous les patients de la structure)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(DOCTOR_SESSION as never);
    makeSelectMock([{ id: 'p-1', firstName: 'Marie', lastName: 'Dupont', structureId: 'struct-1' }]);
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('retourne uniquement les patients assignés pour un IDEL', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    const assignedPatient = { id: 'p-1', firstName: 'Marie', lastName: 'Dupont', structureId: 'struct-1', assignedIdelId: 'user-2' };
    makeSelectMock([assignedPatient]);
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patients: { id: string }[] } };
    expect(body.data.patients).toHaveLength(1);
  });
});