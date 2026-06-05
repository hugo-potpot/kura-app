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
    assignedIdelId: 'assigned_idel_id',
    status: 'status',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  },
  transmissionsPg: {
    id: 'id',
    patientId: 'patient_id',
    createdAt: 'created_at',
  },
  authUser: {
    id: 'id',
    name: 'name',
    structureId: 'structure_id',
    role: 'role',
    disabled: 'disabled',
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
    innerJoin: vi.fn().mockReturnThis(),
  };
  vi.mocked(db.select).mockReturnValue(chain as never);
  return chain;
}

/**
 * Mock pour plusieurs appels sequentiels à db.select().
 * Chaque appel retourne la valeur correspondante dans returnValues[].
 */
function makeSequentialSelectMocks(...returnValues: unknown[]) {
  let callIndex = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const val = returnValues[callIndex++] ?? [];
    return {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(val),
      innerJoin: vi.fn().mockReturnThis(),
    } as never;
  });
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

  it('retourne la liste vide sans erreur (0 patients → pas de requêtes supplémentaires)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    makeSelectMock([]);
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patients: unknown[] } };
    expect(body.data.patients).toHaveLength(0);
  });

  it('retourne la liste des patients avec lastTransmissionAt et assignedIdelName pour un admin', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);

    const mockPatients = [
      { id: 'p-1', firstName: 'Marie', lastName: 'Dupont', status: 'active', structureId: 'struct-1', assignedIdelId: 'idel-1', updatedAt: new Date() },
      { id: 'p-2', firstName: 'Jean', lastName: 'Martin', status: 'archived', structureId: 'struct-1', assignedIdelId: null, updatedAt: new Date() },
    ];
    const mockTransmissions = [
      { patientId: 'p-1', createdAt: new Date('2026-05-20T10:00:00Z') },
    ];
    const mockIdels = [
      { id: 'idel-1', name: 'Sophie Infirmière' },
    ];

    // 3 appels séquentiels : patients, transmissions, idels
    makeSequentialSelectMocks(mockPatients, mockTransmissions, mockIdels);

    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json() as { data: { patients: { id: string; lastTransmissionAt: string | null; assignedIdelName: string | null }[] } };
    expect(body.data.patients).toHaveLength(2);

    const patient1 = body.data.patients.find((p) => p.id === 'p-1');
    expect(patient1?.lastTransmissionAt).not.toBeNull();
    expect(patient1?.assignedIdelName).toBe('Sophie Infirmière');

    const patient2 = body.data.patients.find((p) => p.id === 'p-2');
    expect(patient2?.lastTransmissionAt).toBeNull();
    expect(patient2?.assignedIdelName).toBeNull();
  });

  it('retourne 200 pour un doctor (lecture seule, tous les patients de la structure)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(DOCTOR_SESSION as never);
    makeSequentialSelectMocks(
      [{ id: 'p-1', firstName: 'Marie', lastName: 'Dupont', structureId: 'struct-1', assignedIdelId: null }],
      [], // transmissions
      [], // idels
    );
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('retourne uniquement les patients assignés pour un IDEL', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(IDEL_SESSION as never);
    const assignedPatient = { id: 'p-1', firstName: 'Marie', lastName: 'Dupont', structureId: 'struct-1', assignedIdelId: null };
    makeSequentialSelectMocks(
      [assignedPatient],
      [], // transmissions
      [], // idels
    );
    const req = new NextRequest('http://localhost/api/v1/patients');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { patients: { id: string }[] } };
    expect(body.data.patients).toHaveLength(1);
  });
});
