import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const mockUpdateChain = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
};

const mockSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn(),
};

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => mockSelectChain),
    update: vi.fn(() => mockUpdateChain),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
  },
}));

vi.mock('@kura/db', () => ({
  patientsPg: { id: 'id', structureId: 'structure_id', status: 'status', updatedAt: 'updated_at', assignedIdelId: 'assigned_idel_id', firstName: 'first_name', lastName: 'last_name' },
  auditLogsPg: {},
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PATCH } from './route';

const mockAuth = auth as { api: { getSession: ReturnType<typeof vi.fn> } };
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
};

const adminSession = {
  user: { id: 'user-1', structureId: 'struct-1', role: 'admin' },
};
const mockPatient = {
  id: 'patient-1',
  structureId: 'struct-1',
  status: 'active',
  assignedIdelId: null,
  firstName: 'Marie',
  lastName: 'Dupont',
};
const params = Promise.resolve({ id: 'patient-1' });

function makeRequest() {
  return new Request('http://localhost/api/v1/patients/patient-1/archive', { method: 'PATCH' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateChain.set.mockReturnThis();
  mockUpdateChain.where.mockResolvedValue([]);
});

describe('PATCH /api/v1/patients/[id]/archive', () => {
  it('retourne 401 si pas de session', async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(401);
  });

  it('retourne 403 si pas de structureId', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(403);
  });

  it('retourne 404 si patient introuvable', async () => {
    mockAuth.api.getSession.mockResolvedValue(adminSession);
    mockSelectChain.where.mockResolvedValueOnce([]);
    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(404);
  });

  it('retourne 409 si patient déjà archivé', async () => {
    mockAuth.api.getSession.mockResolvedValue(adminSession);
    mockSelectChain.where.mockResolvedValueOnce([{ ...mockPatient, status: 'archived' }]);
    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('ALREADY_ARCHIVED');
  });

  it('retourne 403 si IDEL tente d\'archiver un patient non assigné', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'idel-1', structureId: 'struct-1', role: 'idel' },
    });
    mockSelectChain.where.mockResolvedValueOnce([{ ...mockPatient, assignedIdelId: 'other-idel' }]);
    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(403);
  });

  it('archive le patient et retourne 200 avec audit log', async () => {
    mockAuth.api.getSession.mockResolvedValue(adminSession);
    mockSelectChain.where
      .mockResolvedValueOnce([mockPatient])
      .mockResolvedValueOnce([{ ...mockPatient, status: 'archived' }]);
    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    const body = await res.json() as { data: { patient: { status: string } } };
    expect(body.data.patient.status).toBe('archived');
  });
});
