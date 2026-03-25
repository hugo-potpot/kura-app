import { renderHook, act } from '@testing-library/react-native';
import { useRegister } from './useRegister';

jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import { apiClient } from '../../../lib/api-client';

describe('useRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export useRegister hook', () => {
    expect(useRegister).toBeDefined();
  });

  it('should call POST /api/auth/sign-up/email on register', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { token: 'jwt-token' } });
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!extra',
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/sign-up/email',
      expect.objectContaining({ email: 'test@example.com' }),
    );
  });

  it('should throw on duplicate email (409)', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      response: { status: 409 },
    });
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await expect(
        result.current.register({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'Password1!extra',
        }),
      ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });
    });
  });
});
