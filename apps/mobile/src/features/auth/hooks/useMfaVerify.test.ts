import { renderHook, act } from '@testing-library/react-native';
import { useMfaVerify } from './useMfaVerify';

jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
}));

jest.mock('../stores/auth-store', () => ({
  useAuthStore: () => ({
    setUser: jest.fn(),
    setSession: jest.fn(),
    clearSession: jest.fn(),
    user: null,
    isAuthenticated: false,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(false),
  isEnrolledAsync: jest.fn().mockResolvedValue(false),
  authenticateAsync: jest.fn(),
}));

import { apiClient } from '../../../lib/api-client';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const mockReplace = jest.fn();

describe('useMfaVerify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export useMfaVerify hook', () => {
    const { result } = renderHook(() => useMfaVerify());
    expect(result.current.verifyTotp).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should call POST /api/auth/two-factor/verify-totp with the code', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { token: 'jwt-token-xxx', user: { id: '1', email: 'test@example.com', name: 'Test' } },
    });
    const { result } = renderHook(() => useMfaVerify());

    await act(async () => {
      await result.current.verifyTotp('123456');
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/two-factor/verify-totp',
      { code: '123456' },
    );
    expect(result.current.error).toBeNull();
  });

  it('should set error "Code incorrect" on invalid TOTP code', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({ response: { status: 400 } });
    const { result } = renderHook(() => useMfaVerify());

    await act(async () => {
      try {
        await result.current.verifyTotp('000000');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Code incorrect, veuillez réessayer');
  });

  it('should route to biometric-setup when biometric is available and not yet configured', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { token: 'jwt-token-xxx', user: { id: '1', email: 'test@example.com', name: 'Test' } },
    });
    // kura_biometric_enabled is null (never asked)
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    // biometric hardware available
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useMfaVerify());

    await act(async () => {
      await result.current.verifyTotp('123456');
    });

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/biometric-setup');
  });
});
