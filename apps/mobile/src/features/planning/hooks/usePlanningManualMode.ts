import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const MANUAL_MODE_KEY = 'kura:planning:manual_mode';

export function usePlanningManualMode(): {
  manualModePur: boolean;
  setManualModePur: (next: boolean) => Promise<void>;
  preferencesReady: boolean;
} {
  const [manualModePur, setManualModePur] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(MANUAL_MODE_KEY).then((v) => {
      setManualModePur(v === 'true');
      setPreferencesReady(true);
    });
  }, []);

  const setManualModePurPersisted = useCallback(async (next: boolean): Promise<void> => {
    setManualModePur(next);
    await AsyncStorage.setItem(MANUAL_MODE_KEY, next ? 'true' : 'false');
  }, []);

  return { manualModePur, setManualModePur: setManualModePurPersisted, preferencesReady };
}
