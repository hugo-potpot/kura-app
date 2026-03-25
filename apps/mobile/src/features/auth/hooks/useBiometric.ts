import { useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'kura_biometric_enabled';

interface UseBiometricReturn {
  checkAvailability: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  isEnabled: () => Promise<boolean>;
  authenticate: () => Promise<boolean>;
}

export function useBiometric(): UseBiometricReturn {
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  }, []);

  const enable = useCallback(async (): Promise<void> => {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, 'false');
  }, []);

  const isEnabled = useCallback(async (): Promise<boolean> => {
    const value = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    return value === 'true';
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authentification KURA',
      cancelLabel: 'Annuler',
      fallbackLabel: 'Utiliser le code',
    });
    return result.success;
  }, []);

  return { checkAvailability, enable, disable, isEnabled, authenticate };
}
