import { renderHook, act } from '@testing-library/react-native';
import { useLogin } from './useLogin';

jest.useFakeTimers();

jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import { apiClient } from '../../../lib/api-client';

describe('useLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should call POST /api/auth/sign-in/email and return twoFactorRedirect', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { twoFactorRedirect: true } });
    const { result } = renderHook(() => useLogin());

    let response: unknown;
    await act(async () => {
      response = await result.current.login('test@example.com', 'Password1!');
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/sign-in/email',
      { email: 'test@example.com', password: 'Password1!' },
    );
    expect(response).toEqual({ twoFactorRedirect: true });
    expect(result.current.error).toBeNull();
    expect(result.current.isLocked).toBe(false);
  });

  it('should set error on invalid credentials (401)', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({ response: { status: 401 } });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Email ou mot de passe incorrect');
    expect(result.current.isLocked).toBe(false);
  });

  it('should lock after 3 failed attempts and set countdown to 30', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({ response: { status: 401 } });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      try { await result.current.login('test@example.com', 'wrong'); } catch { /* expected */ }
    });
    await act(async () => {
      try { await result.current.login('test@example.com', 'wrong'); } catch { /* expected */ }
    });
    await act(async () => {
      try { await result.current.login('test@example.com', 'wrong'); } catch { /* expected */ }
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.countdown).toBe(30);
    expect(result.current.error).toContain('Trop de tentatives');
  });
});
