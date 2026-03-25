import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';

interface PasskeySetupProps {
  onSuccess: () => void;
  onSkip: () => void;
}

// Note: BetterAuth v1.5.5 n'inclut pas de plugin passkey WebAuthn.
// Cette implémentation utilise expo-local-authentication (Face ID/Touch ID)
// comme second facteur côté client. Une vraie implémentation WebAuthn sera
// possible via better-auth passkey plugin dans une version future (story 9.4).
export function PasskeySetup({ onSuccess, onSkip }: PasskeySetupProps): React.JSX.Element {
  const [hasBiometrics, setHasBiometrics] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void checkBiometrics();
  }, []);

  const checkBiometrics = async (): Promise<void> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometrics(hasHardware && isEnrolled);
  };

  const setupBiometric = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Configurez votre authentification biométrique',
      cancelLabel: 'Annuler',
      fallbackLabel: 'Utiliser le code',
    });

    setIsLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError('Authentification biométrique échouée. Veuillez réessayer.');
    }
  };

  if (hasBiometrics === null) {
    return (
      <View style={styles.container}>
        <Text>Vérification des capacités biométriques...</Text>
      </View>
    );
  }

  if (!hasBiometrics) {
    return (
      <View style={styles.container}>
        <Text variant="bodyMedium" style={styles.message}>
          La biométrie n&apos;est pas disponible sur cet appareil.
        </Text>
        <Button
          mode="outlined"
          onPress={onSkip}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Bouton passer cette étape"
        >
          Passer
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Configurer la biométrie
      </Text>
      <Text variant="bodyMedium" style={styles.message}>
        Utilisez Face ID ou Touch ID pour vous authentifier rapidement.
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        mode="contained"
        onPress={setupBiometric}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
        accessibilityLabel="Bouton configurer la biométrie"
      >
        Configurer Face ID / Touch ID
      </Button>
      <Button
        mode="text"
        onPress={onSkip}
        style={styles.skipButton}
        accessibilityLabel="Bouton ignorer la configuration biométrique"
      >
        Ignorer
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16, width: '100%' },
  title: { textAlign: 'center', fontWeight: '600' },
  message: { textAlign: 'center', opacity: 0.7 },
  error: { color: '#E53935', fontSize: 12 },
  button: { width: '100%', minHeight: 48 },
  buttonContent: { minHeight: 48 },
  skipButton: { marginTop: 4 },
});
