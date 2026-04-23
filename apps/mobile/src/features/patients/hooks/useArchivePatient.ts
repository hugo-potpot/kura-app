import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const JWT_KEY = 'kura_jwt';

export function useArchivePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const token = await SecureStore.getItemAsync(JWT_KEY);
      const res = await fetch(`${API_BASE}/api/v1/patients/${patientId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 409) {
        const data = await res.json() as { error: { code: string } };
        if (data.error.code === 'ALREADY_ARCHIVED') throw new Error('ALREADY_ARCHIVED');
      }
      if (!res.ok) throw new Error('ARCHIVE_FAILED');

      return res.json() as Promise<{ data: { patient: unknown } }>;
    },
    onSuccess: (_data, patientId) => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    },
  });
}
