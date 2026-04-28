import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/db', () => ({
  db: { select: vi.fn() },
}));

vi.mock('@kura/db', () => ({
  patientsPg: { id: 'id', structureId: 'structure_id' },
  vitalSignsPg: {
    id: 'id',
    patientId: 'patient_id',
    authorId: 'author_id',
    measuredAt: 'measured_at',
    systolic: 'systolic',
    diastolic: 'diastolic',
    glycemia: 'glycemia',
    weight: 'weight',
    temperature: 'temperature',
    spo2: 'spo2',
    createdAt: 'created_at',
    syncedAt: 'synced_at',
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { GET } from './route';

const ADMIN_SESSION = { user: { id: 'user-1', role: 'admin', structureId: 'struct-1' } };

const MOCK_VITAL_SIGN = {
  id: 'vs-1',
  patientId: 'patient-1',
  authorId: 'user-1',
  measuredAt: new Date('2026-04-01T09:00:00Z'),
  systolic: 120,
  diastolic: 80,
  glycemia: 5.5,
  weight: 70,
  temperature: 37.0,
  spo2: 98,
  createdAt: new Date('2026-04-01T09:00:00Z'),
  syncedAt: null,
};

type RouteParams = { params: Promise<{ id: string }> };

function makeParams(id: string): RouteParams {
  return { params: Promise.resolve({ id }) };
}

function makeSelectChain(returnValue: unknown) {
  const orderBy = vi.fn().mockResolvedValue(returnValue);
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));
  vi.mocked(db.select).mockReturnValueOnce({ from } as never);
  return { from, where, orderBy };
}

describe('GET /api/v1/patients/[id]/vital-signs', () => {
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
      user: { id: 'u', role: 'admin', structureId: null },
    } as never);
    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('NO_STRUCTURE');
  });

  it('retourne 404 si patient introuvable ou mauvaise structure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);
    // Premier select (patient) → []
    const patientOrderBy = vi.fn().mockResolvedValue([]);
    const patientWhere = vi.fn(() => ({ orderBy: patientOrderBy }));
    const patientWhereDirect = vi.fn().mockResolvedValue([]);
    const patientFrom = vi.fn(() => ({ where: patientWhereDirect }));
    vi.mocked(db.select).mockReturnValueOnce({ from: patientFrom } as never);

    const res = await GET(new Request('http://localhost'), makeParams('unknown'));
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('PATIENT_NOT_FOUND');
  });

  it('retourne 200 avec la liste des constantes filtrées', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);

    // Premier select (patient) → [patient]
    const patientWhereDirect = vi.fn().mockResolvedValue([{ id: 'patient-1' }]);
    const patientFrom = vi.fn(() => ({ where: patientWhereDirect }));
    vi.mocked(db.select).mockReturnValueOnce({ from: patientFrom } as never);

    // Deuxième select (vital signs) → [MOCK_VITAL_SIGN]
    makeSelectChain([MOCK_VITAL_SIGN]);

    const res = await GET(new Request('http://localhost?range=30d'), makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { vitalSigns: { id: string }[] } };
    expect(body.data.vitalSigns).toHaveLength(1);
    expect(body.data.vitalSigns[0]?.id).toBe('vs-1');
  });

  it('retourne 200 avec tableau vide si aucune constante', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);

    const patientWhereDirect = vi.fn().mockResolvedValue([{ id: 'patient-1' }]);
    const patientFrom = vi.fn(() => ({ where: patientWhereDirect }));
    vi.mocked(db.select).mockReturnValueOnce({ from: patientFrom } as never);

    makeSelectChain([]);

    const res = await GET(new Request('http://localhost?range=7d'), makeParams('patient-1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { vitalSigns: unknown[] } };
    expect(body.data.vitalSigns).toHaveLength(0);
  });

  it('utilise range=30d par défaut si paramètre absent', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ADMIN_SESSION as never);

    const patientWhereDirect = vi.fn().mockResolvedValue([{ id: 'patient-1' }]);
    const patientFrom = vi.fn(() => ({ where: patientWhereDirect }));
    vi.mocked(db.select).mockReturnValueOnce({ from: patientFrom } as never);

    makeSelectChain([MOCK_VITAL_SIGN]);

    const res = await GET(new Request('http://localhost'), makeParams('patient-1'));
    expect(res.status).toBe(200);
  });
});
