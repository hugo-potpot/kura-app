import { useState, useCallback } from 'react';

import { apiClient } from '@/lib/api-client';

const RESET_PASSWORD_URL = `${process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/reset-password`;

interface UseForgotPasswordReturn {
  requestReset: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/auth/request-password-reset', {
        email,
        redirectTo: RESET_PASSWORD_URL,
      });
    } catch {
      setError('Une erreur réseau est survenue. Vérifiez votre connexion.');
      throw new Error('network_error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { requestReset, isLoading, error };
}
