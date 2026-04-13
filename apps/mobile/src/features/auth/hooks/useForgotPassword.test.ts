import { renderHook, act } from '@testing-library/react-native';
import { useForgotPassword } from './useForgotPassword';

jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import { apiClient } from '../../../lib/api-client';

describe('useForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call POST /api/auth/forgot-password and resolve without error on success (200)', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.requestReset('user@example.com');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/request-password-reset', {
      email: 'user@example.com',
      redirectTo: expect.stringContaining('/reset-password'),
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should resolve without visible error when email does not exist (anti-enumeration — BetterAuth returns 200)', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.requestReset('nonexistent@example.com');
    });

    expect(result.current.error).toBeNull();
  });

  it('should set error on real network failure', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      try {
        await result.current.requestReset('user@example.com');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe(
      'Une erreur réseau est survenue. Vérifiez votre connexion.',
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('should set isLoading to true during request and false after', async () => {
    let resolveRequest: () => void;
    (apiClient.post as jest.Mock).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      void result.current.requestReset('user@example.com');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveRequest!();
    });

    expect(result.current.isLoading).toBe(false);
  });
});
