import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas/forgot-password-schema';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const { requestReset, isLoading, error } = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    try {
      await requestReset(data.email);
    } catch {
      // Erreur réseau — message déjà géré dans le hook
    }
    // Anti-énumération : rediriger vers la confirmation quelle que soit la réponse
    router.replace('/(auth)/forgot-password-confirmation');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineMedium" style={styles.title}>
            Mot de passe oublié
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email"
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                accessibilityLabel="Champ email pour réinitialisation"
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.email}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email?.message}
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
            accessibilityLabel="Envoyer le lien de réinitialisation"
          >
            Envoyer le lien
          </Button>

          <Button
            mode="text"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(auth)/login');
              }
            }}
            style={styles.linkButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Retour à la connexion"
          >
            Retour à la connexion
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: {
    padding: 24,
    gap: 8,
    justifyContent: 'center',
    flexGrow: 1,
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
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    minHeight: 48,
  },
  linkButton: {
    marginTop: 4,
  },
});
