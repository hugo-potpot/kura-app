import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { loginSchema, type LoginFormData } from '@/features/auth/schemas/login-schema';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useBiometric } from '@/features/auth/hooks/useBiometric';

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const { login, isLocked, countdown, error, isLoading } = useLogin();
  const { saveSession, getToken } = useAuth();
  const { setUser } = useAuthStore();
  const { checkAvailability, isEnabled, authenticate } = useBiometric();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const checkBiometric = async (): Promise<void> => {
      const available = await checkAvailability();
      if (!available) return;
      const enabled = await isEnabled();
      setBiometricAvailable(enabled);
    };
    void checkBiometric();
  }, [checkAvailability, isEnabled]);

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
        // error handled by useLogin
      }
    },
    [login, router, saveSession, setUser],
  );

  const onBiometricPress = useCallback(async (): Promise<void> => {
    setBiometricLoading(true);
    try {
      const success = await authenticate();
      if (!success) return;
      const token = await getToken();
      if (token) {
        router.replace('/(app)/planning');
      }
    } finally {
      setBiometricLoading(false);
    }
  }, [authenticate, getToken, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.iconContainer} accessibilityRole="image" accessibilityLabel="Logo KURA">
              <MaterialCommunityIcons name="briefcase-plus" size={28} color="#fff" />
            </View>
            <Text style={styles.logoText}>KURA</Text>
          </View>

          {/* HDS Badge */}
          <View style={styles.hdsBadge}>
            <MaterialCommunityIcons name="lock" size={12} color="#0F766E" />
            <Text style={styles.hdsBadgeText}>HDS Certifié</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, !!errors.email && styles.inputError]}
                    placeholder="infirmiere@kura.fr"
                    placeholderTextColor="#7BA5C2"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    accessibilityLabel="Champ email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
                      placeholder="••••••••••"
                      placeholderTextColor="#7BA5C2"
                      secureTextEntry={!passwordVisible}
                      textContentType="password"
                      autoComplete="current-password"
                      accessibilityLabel="Champ mot de passe"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setPasswordVisible((v) => !v)}
                  accessibilityLabel={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#5C8DAA"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => router.push('/(auth)/forgot-password')}
              accessibilityLabel="Réinitialiser mon mot de passe"
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Erreur / verrouillage */}
            {(error !== null || isLocked) && (
              <View accessible accessibilityRole="alert" style={styles.alertBox}>
                <Text style={styles.alertText}>
                  {isLocked
                    ? `Trop de tentatives, réessayez dans ${countdown}s`
                    : error}
                </Text>
              </View>
            )}

            {/* Bouton Se connecter */}
            <TouchableOpacity
              style={[styles.loginButton, (isLoading || isLocked) && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || isLocked}
              accessibilityLabel={isLocked ? `Connexion bloquée, ${countdown} secondes` : 'Se connecter'}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {isLocked ? `Bloqué (${countdown}s)` : 'Se connecter'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Face ID */}
          {biometricAvailable && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.biometricCard}
                onPress={onBiometricPress}
                disabled={biometricLoading}
                accessibilityLabel="Se connecter avec Face ID"
                activeOpacity={0.85}
              >
                {biometricLoading ? (
                  <ActivityIndicator color="#3949AB" size="large" />
                ) : (
                  <MaterialCommunityIcons name="face-recognition" size={40} color="#3949AB" />
                )}
              </TouchableOpacity>
              <Text style={styles.biometricLabel}>Utiliser Face ID</Text>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#94A3B8" />
            <Text style={styles.footerText}>CONNEXION SÉCURISÉE HDS</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = '#3949AB';
const INPUT_BG = '#C8DFF0';
const BACKGROUND = '#E8F0F8';
const TEAL = '#14B8A6';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: PRIMARY,
    letterSpacing: 1,
  },

  // HDS Badge
  hdsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 40,
  },
  hdsBadgeText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '600',
  },

  // Form
  formContainer: {
    width: '100%',
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C8DAA',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E3A5F',
    minHeight: 52,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#E53935',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    alignItems: 'flex-end',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Forgot
  forgotContainer: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginBottom: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  forgotText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },

  // Alert
  alertBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },

  // Login button
  loginButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#B8CDD9',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  // Biometric
  biometricCard: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 80,
  },
  biometricLabel: {
    color: '#4B6A80',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingTop: 32,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
});
