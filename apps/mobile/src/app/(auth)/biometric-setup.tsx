import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { useBiometric } from '@/features/auth/hooks/useBiometric';

export default function BiometricSetupScreen(): React.JSX.Element {
  const router = useRouter();
  const { enable, disable } = useBiometric();

  const handleActivate = useCallback(async (): Promise<void> => {
    await enable();
    router.replace('/(app)/planning');
  }, [enable, router]);

  const handleSkip = useCallback(async (): Promise<void> => {
    await disable();
    router.replace('/(app)/planning');
  }, [disable, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Accès rapide par biométrie
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Activez Face ID ou Touch ID pour vous connecter en moins d'une seconde sans ressaisir
          votre mot de passe.
        </Text>

        <Button
          mode="contained"
          onPress={handleActivate}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Activer l'authentification biométrique"
        >
          Activer
        </Button>

        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Ignorer l'activation biométrique pour l'instant"
        >
          Plus tard
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    minHeight: 48,
  },
  skipButton: {
    width: '100%',
  },
});
