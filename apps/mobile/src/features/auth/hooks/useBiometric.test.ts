import { renderHook, act } from '@testing-library/react-native';
import { useBiometric } from './useBiometric';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

describe('useBiometric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return available=true when hardware and enrollment are present', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useBiometric());

    let available: boolean = false;
    await act(async () => {
      available = await result.current.checkAvailability();
    });

    expect(available).toBe(true);
  });

  it('should return available=false when hardware is missing', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    const { result } = renderHook(() => useBiometric());

    let available: boolean = true;
    await act(async () => {
      available = await result.current.checkAvailability();
    });

    expect(available).toBe(false);
  });

  it('should store kura_biometric_enabled=true when enable() is called', async () => {
    const { result } = renderHook(() => useBiometric());

    await act(async () => {
      await result.current.enable();
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('kura_biometric_enabled', 'true');
  });

  it('should return true from isEnabled() when SecureStore has true', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');
    const { result } = renderHook(() => useBiometric());

    let enabled: boolean = false;
    await act(async () => {
      enabled = await result.current.isEnabled();
    });

    expect(enabled).toBe(true);
  });

  it('should return success=true when authenticate() succeeds', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useBiometric());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.authenticate();
    });

    expect(success).toBe(true);
  });

  it('should return success=false when authenticate() fails', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: false,
      error: 'authentication_failed',
    });
    const { result } = renderHook(() => useBiometric());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.authenticate();
    });

    expect(success).toBe(false);
  });
});
