import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '../../../lib/api-client';
import type { RegisterFormData } from '../schemas/register-schema';

const JWT_KEY = 'kura_jwt';

interface RegisterError {
  code: string;
  message: string;
}

interface SignUpResponse {
  token?: string;
}

interface EnableTwoFactorResponse {
  totpURI: string;
}

interface RegisterResult {
  totpUri: string;
}

interface UseRegisterResult {
  register: (data: RegisterFormData) => Promise<RegisterResult>;
  isLoading: boolean;
  error: RegisterError | null;
}

export function useRegister(): UseRegisterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);

  const register = async (data: RegisterFormData): Promise<RegisterResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create account
      const { data: signUpData } = await apiClient.post<SignUpResponse>('/api/auth/sign-up/email', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const token = signUpData.token ?? '';
      if (token) {
        await SecureStore.setItemAsync(JWT_KEY, token);
      }

      // 2. Enable 2FA and get TOTP URI
      const { data: enableData } = await apiClient.post<EnableTwoFactorResponse>(
        '/api/auth/two-factor/enable',
        { password: data.password },
        { headers: { Authorization: `Bearer ${token}` }, skipUnauthorizedHandler: true },
      );

      return { totpUri: enableData.totpURI };
    } catch (err: unknown) {
      const apiError = err as { response?: { status: number } };
      if (apiError?.response?.status === 409) {
        const registerError: RegisterError = {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Un compte existe déjà avec cet email',
        };
        setError(registerError);
        throw registerError;
      }
      const genericError: RegisterError = {
        code: 'REGISTER_FAILED',
        message: 'La création de compte a échoué',
      };
      setError(genericError);
      throw genericError;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
}
