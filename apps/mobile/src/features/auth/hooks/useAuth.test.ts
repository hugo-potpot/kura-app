import { useAuth } from './useAuth';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../stores/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    setSession: jest.fn(),
    clearSession: jest.fn(),
    user: null,
    isAuthenticated: false,
  })),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/lib/api-client';

function makeJwtWithExp(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${header}.${payload}.fakesignature`;
}

const NOW = Math.floor(Date.now() / 1000);
const VALID_TOKEN = makeJwtWithExp(NOW + 86400 * 7); // expires in 7 days
const EXPIRED_TOKEN = makeJwtWithExp(NOW - 86400); // expired yesterday

describe('useAuth', () => {
  it('should export useAuth hook', () => {
    expect(useAuth).toBeDefined();
  });

  it('should expose saveSession, clearSession, getToken functions', () => {
    const auth = useAuth();
    expect(typeof auth.saveSession).toBe('function');
    expect(typeof auth.clearSession).toBe('function');
    expect(typeof auth.getToken).toBe('function');
  });

  it('should call SecureStore.setItemAsync with kura_jwt when saving session', async () => {
    const auth = useAuth();
    await auth.saveSession({ token: 'test-jwt', refreshToken: 'test-refresh' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kura_jwt', 'test-jwt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kura_refresh_token', 'test-refresh');
  });

  it('should call SecureStore.deleteItemAsync when clearing session', async () => {
    const auth = useAuth();
    await auth.clearSession();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('kura_jwt');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('kura_refresh_token');
  });

  it('should call SecureStore.getItemAsync with kura_jwt when getting token', async () => {
    const auth = useAuth();
    await auth.getToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('kura_jwt');
  });

  describe('isJwtExpired', () => {
    it('should return false for a valid token (exp in future)', () => {
      const auth = useAuth();
      expect(auth.isJwtExpired(VALID_TOKEN)).toBe(false);
    });

    it('should return true for an expired token (exp in past)', () => {
      const auth = useAuth();
      expect(auth.isJwtExpired(EXPIRED_TOKEN)).toBe(true);
    });

    it('should return false for a token with no exp claim (opaque/BetterAuth token)', () => {
      const auth = useAuth();
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user123' })).toString('base64url');
      const tokenNoExp = `${header}.${payload}.sig`;
      expect(auth.isJwtExpired(tokenNoExp)).toBe(false);
    });

    it('should return false for an opaque token (non-JWT BetterAuth session)', () => {
      const auth = useAuth();
      expect(auth.isJwtExpired('opaque-session-token-abc123')).toBe(false);
    });

    it('should return false for an empty string (cannot determine expiry)', () => {
      const auth = useAuth();
      expect(auth.isJwtExpired('')).toBe(false);
    });
  });

  describe('refreshJwt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return true and save new session on successful refresh', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('old-refresh-token');
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { token: 'new-jwt', refreshToken: 'new-refresh' },
      });

      const auth = useAuth();
      const result = await auth.refreshJwt();

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh-token', {
        refreshToken: 'old-refresh-token',
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kura_jwt', 'new-jwt');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kura_refresh_token', 'new-refresh');
    });

    it('should return false when refresh token is absent', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const auth = useAuth();
      const result = await auth.refreshJwt();

      expect(result).toBe(false);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should return false on network error without clearing session', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('old-refresh-token');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const auth = useAuth();
      const result = await auth.refreshJwt();

      expect(result).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('should return false on 401 without clearing session', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('old-refresh-token');
      (apiClient.post as jest.Mock).mockRejectedValueOnce({ response: { status: 401 } });

      const auth = useAuth();
      const result = await auth.refreshJwt();

      expect(result).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});