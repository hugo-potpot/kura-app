import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Patient } from '@kura/shared';

interface PatientsParams {
  search?: string;
  status?: 'active' | 'archived';
}

export function usePatients({ search, status }: PatientsParams = {}) {
  return useQuery({
    queryKey: ['patients', search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search && search.length >= 2) params.set('search', search);
      if (status) params.set('status', status);
      const qs = params.toString();
      const path = `/api/v1/patients${qs ? `?${qs}` : ''}`;
      // Response body: { data: { patients: Patient[] } }
      const res = await apiClient.get<{ data: { patients: Patient[] } }>(path);
      return res.data.data.patients;
    },
    staleTime: 30_000,
  });
}
