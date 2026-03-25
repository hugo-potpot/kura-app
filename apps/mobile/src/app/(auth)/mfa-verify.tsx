import { useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useMfaVerify } from '@/features/auth/hooks/useMfaVerify';

const totpSchema = z.object({
  code: z
    .string()
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code ne doit contenir que des chiffres'),
});

type TotpFormData = z.infer<typeof totpSchema>;

export default function MfaVerifyScreen(): React.JSX.Element {
  const { verifyTotp, error, isLoading } = useMfaVerify();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
  });

  const onSubmit = useCallback(
    async (data: TotpFormData): Promise<void> => {
      try {
        await verifyTotp(data.code);
      } catch {
        // error handled by useMfaVerify
      }
    },
    [verifyTotp],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.title}>
            Vérification MFA
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Saisissez le code à 6 chiffres de votre application d'authentification.
          </Text>

          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Code TOTP"
                mode="outlined"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                accessibilityLabel="Code d'authentification à 6 chiffres"
                maxLength={6}
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.code}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.code}>
            {errors.code?.message}
          </HelperText>

          {error !== null && (
            <View accessible accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Valider le code d'authentification"
          >
            Valider
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  input: { backgroundColor: 'transparent' },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    minHeight: 48,
  },
});
