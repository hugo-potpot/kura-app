import { renderHook, act } from '@testing-library/react-native';
import { useLogout } from './useLogout';

const mockReplace = jest.fn();

jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../stores/auth-store', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    clearSession: jest.fn(),
    setSession: jest.fn(),
    setUser: jest.fn(),
  }),
}));

import { apiClient } from '../../../lib/api-client';

describe('useLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call POST /api/auth/sign-out and navigate to login on logout', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/sign-out', {});
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    expect(result.current.isLoading).toBe(false);
  });

  it('should call POST /api/auth/revoke-sessions and navigate to login on logoutAllDevices', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logoutAllDevices();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/revoke-sessions', {});
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('should still navigate to login even if sign-out network request fails', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    expect(result.current.isLoading).toBe(false);
  });

  it('should still navigate to login even if revoke-sessions network request fails', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logoutAllDevices();
    });

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    expect(result.current.isLoading).toBe(false);
  });
});
