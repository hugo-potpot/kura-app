import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn(),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    })),
  },
}));

jest.mock('@kura/db', () => ({
  patients: { id: 'id', structureId: 'structure_id' },
  syncQueue: {},
}));

jest.mock('@kura/shared', () => ({
  generateId: jest.fn(() => 'mock-id-001'),
}));

jest.mock('@/lib/geocoding', () => ({
  geocodeAddress: jest.fn().mockResolvedValue({ lat: 48.8566, lng: 2.3522 }),
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ col, val })),
}));

import { db } from '@/lib/db';
import { useCreatePatient } from './useCreatePatient';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

const INPUT = {
  structureId: 'struct-1',
  firstName: 'Marie',
  lastName: 'Dupont',
  address: '12 rue de la Paix, Paris',
};

function makeInsertChain(returnValue: unknown) {
  const chain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(returnValue),
  };
  jest.mocked(db.insert).mockReturnValue(chain as never);
  return chain;
}

describe('useCreatePatient', () => {
  beforeEach(() => jest.clearAllMocks());

  it('insère le patient dans SQLite et retourne le patient créé', async () => {
    const mockPatient = { id: 'mock-id-001', ...INPUT, latitude: null, longitude: null, status: 'active', createdAt: new Date(), updatedAt: new Date(), syncedAt: null, phone: null, treatingDoctor: null };
    makeInsertChain([mockPatient]);

    const { result } = renderHook(() => useCreatePatient(), { wrapper: makeWrapper() });

    let patient: { id: string } | undefined;
    await act(async () => {
      patient = await result.current.mutateAsync(INPUT) as { id: string };
    });

    expect(patient?.id).toBe('mock-id-001');
    expect(db.insert).toHaveBeenCalledTimes(2); // patients + syncQueue
  });

  it('passe en état error si l\'insertion échoue', async () => {
    const chain = {
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockRejectedValue(new Error('DB error')),
    };
    jest.mocked(db.insert).mockReturnValue(chain as never);

    const { result } = renderHook(() => useCreatePatient(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync(INPUT);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
