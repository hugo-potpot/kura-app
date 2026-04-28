import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { getApiBaseUrl } from '@/lib/api-client';
const JWT_KEY = 'kura_jwt';

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, force = false }: { patientId: string; force?: boolean }) => {
      const token = await SecureStore.getItemAsync(JWT_KEY);
      const url = `${getApiBaseUrl()}/api/v1/patients/${patientId}${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 409) {
        const data = await res.json() as { error: { code: string } };
        if (data.error.code === 'RETENTION_WARNING') throw new Error('RETENTION_WARNING');
      }
      if (!res.ok && res.status !== 204) throw new Error('DELETE_FAILED');
    },
    onSuccess: (_data, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.removeQueries({ queryKey: ['patient', patientId] });
    },
  });
}
