import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '../stores/auth-store';
import { apiClient } from '@/lib/api-client';

const JWT_KEY = 'kura_jwt';
const REFRESH_KEY = 'kura_refresh_token';

interface Session {
  token: string;
  refreshToken: string;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export function useAuth(): {
  saveSession: (session: Session) => Promise<void>;
  clearSession: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isJwtExpired: (token: string) => boolean;
  refreshJwt: () => Promise<boolean>;
  user: ReturnType<typeof useAuthStore>['user'];
  isAuthenticated: ReturnType<typeof useAuthStore>['isAuthenticated'];
} {
  const { user, isAuthenticated, setSession, clearSession: storeClear } = useAuthStore();

  const saveSession = async (session: Session): Promise<void> => {
    await SecureStore.setItemAsync(JWT_KEY, session.token);
    await SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken);
  };

  const clearSession = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(JWT_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    storeClear();
  };

  const getToken = async (): Promise<string | null> => {
    return SecureStore.getItemAsync(JWT_KEY);
  };

  const isJwtExpired = (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) return true;

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      const payload = JSON.parse(json) as { exp?: number };

      if (typeof payload.exp !== 'number') return true;

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp < nowInSeconds;
    } catch {
      return true;
    }
  };

  const refreshJwt = async (): Promise<boolean> => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return false;

    try {
      const response = await apiClient.post<RefreshResponse>('/api/v1/auth/refresh-token', {
        refreshToken,
      });
      await saveSession({ token: response.data.token, refreshToken: response.data.refreshToken });
      return true;
    } catch {
      return false;
    }
  };

  return { saveSession, clearSession, getToken, isJwtExpired, refreshJwt, user, isAuthenticated };
}