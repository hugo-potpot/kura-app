import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISABLE_VOICE_KEY = '@kura/disable_voice_transmission';

export interface TransmissionPreferences {
  disableVoice: boolean;
  setDisableVoice: (value: boolean) => Promise<void>;
  hydrated: boolean;
}

export function useTransmissionPreferences(): TransmissionPreferences {
  const [disableVoice, setDisableVoiceState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(DISABLE_VOICE_KEY)
      .then((raw) => {
        if (!cancelled) {
          setDisableVoiceState(raw === 'true');
          setHydrated(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => { cancelled = true; };
  }, []);

  const setDisableVoice = useCallback(async (value: boolean) => {
    setDisableVoiceState(value);
    await AsyncStorage.setItem(DISABLE_VOICE_KEY, value ? 'true' : 'false');
  }, []);

  return { disableVoice, setDisableVoice, hydrated };
}
