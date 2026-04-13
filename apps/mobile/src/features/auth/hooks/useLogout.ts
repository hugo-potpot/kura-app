import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

import { apiClient } from '@/lib/api-client';
import { useAuth } from './useAuth';

interface UseLogoutReturn {
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  isLoading: boolean;
}

export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { clearSession } = useAuth();

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/sign-out', {});
    } catch {
      // Déconnexion locale garantie même en cas d'erreur réseau
    } finally {
      await clearSession();
      router.replace('/(auth)/login');
      setIsLoading(false);
    }
  }, [clearSession, router]);

  const logoutAllDevices = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/revoke-sessions', {});
    } catch {
      // Révocation locale garantie même en cas d'erreur réseau
    } finally {
      await clearSession();
      router.replace('/(auth)/login');
      setIsLoading(false);
    }
  }, [clearSession, router]);

  return { logout, logoutAllDevices, isLoading };
}
