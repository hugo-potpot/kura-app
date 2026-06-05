import { useState, useCallback, useRef } from 'react';

import { apiClient } from '@/lib/api-client';

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30;

interface LoginResponse {
  twoFactorRedirect?: boolean;
  token?: string;
  user?: { id: string; email: string; name: string };
}

interface UseLoginReturn {
  login: (email: string, password: string) => Promise<LoginResponse>;
  isLocked: boolean;
  countdown: number;
  error: string | null;
  isLoading: boolean;
}

export function useLogin(): UseLoginReturn {
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startLockoutTimer = useCallback((): void => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsLocked(false);
          attemptsRef.current = 0;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      if (isLocked) {
        throw new Error('Compte temporairement bloqué');
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.post<LoginResponse>('/api/auth/sign-in/email', {
          email,
          password,
        }, { skipUnauthorizedHandler: true });
        attemptsRef.current = 0;
        return data;
      } catch (err: unknown) {
        attemptsRef.current += 1;

        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setCountdown(LOCKOUT_DURATION);
          startLockoutTimer();
          setError(`Trop de tentatives, réessayez dans ${LOCKOUT_DURATION} secondes`);
        } else {
          const apiErr = err as { response?: { status: number } };
          if (!apiErr.response) {
            console.log(apiErr);
            setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
          } else if (apiErr.response.status === 401) {
            setError('Email ou mot de passe incorrect');
          } else {
            setError('Une erreur est survenue, veuillez réessayer');
          }
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isLocked, startLockoutTimer],
  );

  return { login, isLocked, countdown, error, isLoading };
}
