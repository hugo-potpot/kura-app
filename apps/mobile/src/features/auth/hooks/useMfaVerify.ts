import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useBiometric } from '@/features/auth/hooks/useBiometric';

const BIOMETRIC_KEY = 'kura_biometric_enabled';

const JWT_KEY = 'kura_jwt';
const REFRESH_KEY = 'kura_refresh_token';

interface VerifyTotpResponse {
  token?: string;
  refreshToken?: string;
  user?: { id: string; email: string; name: string };
}

interface UseMfaVerifyReturn {
  verifyTotp: (code: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export function useMfaVerify(): UseMfaVerifyReturn {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { checkAvailability } = useBiometric();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyTotp = useCallback(
    async (code: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.post<VerifyTotpResponse>(
          '/api/auth/two-factor/verify-totp',
          { code },
        );

        if (data.token) {
          await SecureStore.setItemAsync(JWT_KEY, data.token);
        }
        if (data.refreshToken) {
          await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
        }
        if (data.user) {
          setUser(data.user);
        }

        // AC1 story 1.4 : propose biometric setup on first login
        const biometricPref = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        if (biometricPref === null) {
          const available = await checkAvailability();
          if (available) {
            router.replace('/(auth)/biometric-setup');
            return;
          }
        }

        router.replace('/(app)/planning');
      } catch {
        setError('Code incorrect, veuillez réessayer');
        throw new Error('Code incorrect, veuillez réessayer');
      } finally {
        setIsLoading(false);
      }
    },
    [router, setUser, checkAvailability],
  );

  return { verifyTotp, error, isLoading };
}
