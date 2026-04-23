import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBiometric } from '@/features/auth/hooks/useBiometric';
import { getIsOnline } from '@/lib/useNetworkStatus';
import { setUnauthorizedHandler } from '@/lib/api-client';
import { BottomTabBar } from '@/components/BottomTabBar';
import { COLORS } from '@/theme/kura-theme';

const MAX_BIOMETRIC_FAILURES = 2;

export default function AppLayout(): React.JSX.Element {
  const router = useRouter();
  const { getToken, isJwtExpired, refreshJwt, clearSession } = useAuth();
  const { isEnabled, authenticate } = useBiometric();
  const biometricFailsRef = useRef(0);

  // Détection révocation session via 401 (AC2 story 1.7)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void (async () => {
        await clearSession();
        router.replace({ pathname: '/(auth)/session-expired', params: { reason: 'revoked' } });
      })();
    });
  }, [clearSession, router]);

  useEffect(() => {
    void (async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      // Vérification token expiré offline
      const online = await getIsOnline();
      if (!online && isJwtExpired(token)) {
        router.replace('/(auth)/session-expired');
        return;
      }

      // Validation côté serveur — si le refresh échoue pour révocation réelle (401), c'est
      // l'unauthorizedHandler qui gère. Ici on ne clear pas pour une erreur réseau transitoire.
      if (online) {
        await refreshJwt();
        // Ne pas invalider : si refreshJwt échoue (réseau), on continue avec le token existant.
        // La révocation réelle est gérée par le 401 de l'API (unauthorizedHandler).
      }

      // Biométrie au démarrage (AC2/AC3 story 1.4)
      const biometricEnabled = await isEnabled();
      if (!biometricEnabled) return;

      const success = await authenticate();
      if (success) {
        biometricFailsRef.current = 0;
        return;
      }

      biometricFailsRef.current += 1;
      if (biometricFailsRef.current >= MAX_BIOMETRIC_FAILURES) {
        biometricFailsRef.current = 0;
        router.replace('/(auth)/login');
      }
    })();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="planning/index"
        options={{ title: 'Planning' }}
      />
      <Tabs.Screen
        name="patients/index"
        options={{ title: 'Patients' }}
      />
      <Tabs.Screen
        name="transmissions/index"
        options={{ title: 'Transmissions' }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: 'Profil' }}
      />
      <Tabs.Screen name="patients/new" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]" options={{ href: null }} />
    </Tabs>
  );
}
