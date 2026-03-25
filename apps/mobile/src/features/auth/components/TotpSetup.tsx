import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

import { apiClient } from '../../../lib/api-client';

interface TotpSetupProps {
  totpUri: string;
  sessionToken: string;
  onSuccess: () => void;
}

export function TotpSetup({ totpUri, sessionToken, onSuccess }: TotpSetupProps): React.JSX.Element {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'qr' | 'verify'>('qr');

  const verifyCode = async (): Promise<void> => {
    if (code.length !== 6) {
      setError('Le code doit contenir exactement 6 chiffres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post(
        '/api/auth/two-factor/verify-totp',
        { code },
        { Authorization: `Bearer ${sessionToken}` },
      );
      onSuccess();
    } catch {
      setError('Code invalide. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 'qr' && totpUri && (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Scannez ce QR code avec votre application d&apos;authentification
          </Text>
          <View style={styles.qrContainer} accessibilityLabel="QR code d'authentification">
            <QRCode value={totpUri} size={200} />
          </View>
          <Button
            mode="contained"
            onPress={() => setStep('verify')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Bouton j'ai scanné le QR code"
          >
            J&apos;ai scanné le QR code
          </Button>
        </>
      )}

      {step === 'verify' && (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Saisissez le code à 6 chiffres
          </Text>
          <TextInput
            label="Code TOTP"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            accessibilityLabel="Champ code TOTP 6 chiffres"
            allowFontScaling
            maxFontSizeMultiplier={1.5}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            mode="contained"
            onPress={verifyCode}
            loading={isLoading}
            disabled={isLoading || code.length !== 6}
            style={styles.button}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Bouton valider le code"
          >
            Valider
          </Button>
        </>
      )}

      {error && step === 'qr' && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16, width: '100%' },
  title: { textAlign: 'center', fontWeight: '600' },
  qrContainer: { padding: 16, backgroundColor: 'white', borderRadius: 8 },
  input: { width: '100%', marginBottom: 4 },
  error: { color: '#E53935', fontSize: 12 },
  button: { width: '100%', minHeight: 48 },
  buttonContent: { minHeight: 48 },
});
