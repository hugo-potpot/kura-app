import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { TotpSetup } from '@/features/auth/components/TotpSetup';
import { PasskeySetup } from '@/features/auth/components/PasskeySetup';
import { useAuth } from '@/features/auth/hooks/useAuth';

type MfaMethod = 'totp' | 'passkey';

export default function MfaSetupScreen(): React.JSX.Element {
  const router = useRouter();
  const { getToken } = useAuth();
  const { totpUri } = useLocalSearchParams<{ totpUri: string }>();
  const [method, setMethod] = useState<MfaMethod>('totp');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session token on mount (needed for verify step)
  void getToken().then((token) => {
    if (token && !sessionToken) setSessionToken(token);
  });

  const onMfaSuccess = (): void => {
    router.replace('/(app)/planning');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">
          Configurer le MFA
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Un second facteur est obligatoire pour sécuriser votre compte.
        </Text>

        <SegmentedButtons
          value={method}
          onValueChange={(v) => setMethod(v as MfaMethod)}
          buttons={[
            {
              value: 'totp',
              label: 'Application',
              accessibilityLabel: 'Option application authenticator',
            },
            {
              value: 'passkey',
              label: 'Biométrie',
              accessibilityLabel: 'Option biométrie',
            },
          ]}
          style={styles.segmented}
        />

        {method === 'totp' && totpUri && sessionToken && (
          <TotpSetup totpUri={totpUri} sessionToken={sessionToken} onSuccess={onMfaSuccess} />
        )}

        {method === 'passkey' && (
          <PasskeySetup onSuccess={onMfaSuccess} onSkip={() => setMethod('totp')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, gap: 16 },
  title: { fontWeight: 'bold' },
  subtitle: { opacity: 0.7, marginBottom: 8 },
  segmented: { marginBottom: 24 },
});
