import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useTheme } from 'react-native-paper';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBiometric } from '@/features/auth/hooks/useBiometric';
import { getIsOnline } from '@/lib/useNetworkStatus';

const MAX_BIOMETRIC_FAILURES = 2;

export default function AppLayout(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { getToken, isJwtExpired, refreshJwt } = useAuth();
  const { isEnabled, authenticate } = useBiometric();
  const biometricFailsRef = useRef(0);

  useEffect(() => {
    void (async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      // AC1/AC2/AC3 story 1.5 : JWT expiry check + offline refresh
      if (isJwtExpired(token)) {
        const online = await getIsOnline();
        if (online) {
          const refreshed = await refreshJwt();
          if (!refreshed) {
            router.replace('/(auth)/session-expired');
            return;
          }
        } else {
          router.replace('/(auth)/session-expired');
          return;
        }
      }

      // AC2/AC3 story 1.4 : biometric prompt on cold start
      const biometricEnabled = await isEnabled();
      if (!biometricEnabled) return;

      const success = await authenticate();
      if (success) {
        biometricFailsRef.current = 0;
        return;
      }

      // user_cancel ne compte pas comme un échec
      biometricFailsRef.current += 1;
      if (biometricFailsRef.current >= MAX_BIOMETRIC_FAILURES) {
        biometricFailsRef.current = 0;
        router.replace('/(auth)/login');
      }
    })();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="planning/index"
        options={{
          title: 'Planning',
          tabBarLabel: 'Planning',
        }}
      />
      <Tabs.Screen
        name="patients/index"
        options={{
          title: 'Patients',
          tabBarLabel: 'Patients',
        }}
      />
      <Tabs.Screen
        name="transmissions/index"
        options={{
          title: 'Transmissions',
          tabBarLabel: 'Transmissions',
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
        }}
      />
    </Tabs>
  );
}
