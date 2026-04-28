import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { apiClient } from '@/lib/api-client';

import { useVitalSigns } from './useVitalSigns';

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn() },
}));

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

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
  measuredAt: '2026-04-01T09:00:00.000Z',
  systolic: 120,
  diastolic: 80,
  glycemia: 5.5,
  weight: 70,
  temperature: 37,
  spo2: 98,
  createdAt: '2026-04-01T09:00:00.000Z',
  syncedAt: null,
};

describe('useVitalSigns', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('retourne les constantes vitales pour un patient', async () => {
    mockGet.mockResolvedValue({
      data: { data: { vitalSigns: [MOCK_VITAL_SIGN] } },
    });

    const { result } = renderHook(() => useVitalSigns('patient-1', '30d'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/api/v1/patients/patient-1/vital-signs?range=30d');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe('vs-1');
    expect(result.current.data?.[0]?.systolic).toBe(120);
  });

  it('retourne un tableau vide si aucune constante enregistrée', async () => {
    mockGet.mockResolvedValue({
      data: { data: { vitalSigns: [] } },
    });

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
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('utilise range=30d par défaut', async () => {
    mockGet.mockResolvedValue({
      data: { data: { vitalSigns: [MOCK_VITAL_SIGN] } },
    });

    const { result } = renderHook(() => useVitalSigns('patient-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/api/v1/patients/patient-1/vital-signs?range=30d');
    expect(result.current.data).toHaveLength(1);
  });
});
