import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { getDb } from '@/lib/db';

const mockSelect = jest.fn();

jest.mock('@/lib/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('@kura/db', () => ({
  vitalSigns: {
    patientId: 'patient_id',
    measuredAt: 'measured_at',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ col, val })),
  and: jest.fn((...args) => args),
  gte: jest.fn((col, val) => ({ col, val })),
}));

import { useVitalSigns } from './useVitalSigns';

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

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

function makeSelectChain(returnValue: unknown) {
  const orderBy = jest.fn().mockResolvedValue(returnValue);
  const where = jest.fn(() => ({ orderBy }));
  const from = jest.fn(() => ({ where }));
  mockSelect.mockReturnValueOnce({ from });
}

describe('useVitalSigns', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockGetDb.mockReset();
    mockGetDb.mockResolvedValue({ select: mockSelect } as never);
  });

  it('retourne les constantes vitales pour un patient', async () => {
    makeSelectChain([MOCK_VITAL_SIGN]);

    const { result } = renderHook(() => useVitalSigns('patient-1', '30d'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe('vs-1');
    expect(result.current.data?.[0]?.systolic).toBe(120);
  });

  it('retourne un tableau vide si aucune constante enregistrée', async () => {
    makeSelectChain([]);

    const { result } = renderHook(() => useVitalSigns('patient-1', '7d'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });

  it('ne s\'exécute pas si patientId est vide', () => {
    const { result } = renderHook(() => useVitalSigns('', '30d'), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('utilise range=30d par défaut', async () => {
    makeSelectChain([MOCK_VITAL_SIGN]);

    const { result } = renderHook(() => useVitalSigns('patient-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
