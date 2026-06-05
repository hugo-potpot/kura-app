import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Patient } from '@kura/shared';

async function fetchPatient(id: string): Promise<Patient | null> {
  try {
    const res = await apiClient.get<{ data: { patient: Patient } }>(`/api/v1/patients/${id}`);
    return res.data.data.patient;
  } catch {
    return null;
  }
}

export type { Patient };

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchPatient(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
