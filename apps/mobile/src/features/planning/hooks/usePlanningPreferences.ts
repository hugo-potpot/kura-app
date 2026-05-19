import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_PLANNING_PREFERENCES,
  PlanningPreferencesSchema,
  type PlanningPreferences,
} from './planning-preferences-schema';

const PREFS_KEY = 'kura:planning:preferences';
const LEGACY_MANUAL_KEY = 'kura:planning:manual_mode';

export function usePlanningPreferences(): {
  preferences: PlanningPreferences;
  setPreferences: (patch: Partial<PlanningPreferences>) => Promise<void>;
  preferencesReady: boolean;
} {
  const [preferences, setPreferencesState] = useState<PlanningPreferences>(
    DEFAULT_PLANNING_PREFERENCES,
  );
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw !== null) {
        const parsed = PlanningPreferencesSchema.safeParse(JSON.parse(raw) as unknown);
        if (parsed.success) {
          setPreferencesState(parsed.data);
          setPreferencesReady(true);
          return;
        }
      }
      // Migration depuis l'ancienne clé manualModePur standalone
      const legacyManual = await AsyncStorage.getItem(LEGACY_MANUAL_KEY);
      const migrated: PlanningPreferences = {
        ...DEFAULT_PLANNING_PREFERENCES,
        manualModePur: legacyManual === 'true',
      };
      setPreferencesState(migrated);
      setPreferencesReady(true);
    })();
  }, []);

  const setPreferences = useCallback(async (patch: Partial<PlanningPreferences>): Promise<void> => {
    setPreferencesState((prev) => {
      const next = { ...prev, ...patch };
      void AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { preferences, setPreferences, preferencesReady };
}
