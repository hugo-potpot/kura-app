import { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { loginSchema, type LoginFormData } from '@/features/auth/schemas/login-schema';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const { login, isLocked, countdown, error, isLoading } = useLogin();
  const { saveSession } = useAuth();
  const { setUser } = useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = useCallback(
    async (data: LoginFormData): Promise<void> => {
      try {
        const response = await login(data.email, data.password);
        if (response.twoFactorRedirect) {
          router.push('/(auth)/mfa-verify');
        } else if (response.token) {
          await saveSession({ token: response.token, refreshToken: response.token });
          if (response.user) setUser(response.user);
          router.replace('/(app)/planning');
        }
      } catch {
        // error already handled by useLogin
      }
    },
    [login, router],
  );

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
          <Text variant="headlineLarge" style={styles.title}>
            KURA
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Votre assistant infirmier intelligent
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
                accessibilityLabel="Champ email"
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Mot de passe"
                mode="outlined"
                secureTextEntry={!passwordVisible}
                textContentType="password"
                autoComplete="current-password"
                accessibilityLabel="Champ mot de passe"
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.password}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? 'eye-off' : 'eye'}
                    accessibilityLabel={
                      passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                    onPress={() => setPasswordVisible((v) => !v)}
                  />
                }
              />
            )}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password?.message}
          </HelperText>

          {error !== null && !isLocked && (
            <View accessible accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isLocked && (
            <View accessible accessibilityRole="alert">
              <Text style={styles.lockText}>
                {`Trop de tentatives, réessayez dans ${countdown} seconde${countdown > 1 ? 's' : ''}`}
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading || isLocked}
            style={styles.button}
            contentStyle={styles.buttonContent}
            accessibilityLabel={isLocked ? `Connexion bloquée, ${countdown} secondes` : 'Se connecter'}
          >
            {isLocked ? `Bloqué (${countdown}s)` : 'Se connecter'}
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(auth)/register')}
            style={styles.linkButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Créer un compte"
          >
            Créer un compte
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
  lockText: {
    color: '#F57C00',
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
  linkButton: {
    marginTop: 4,
  },
});
