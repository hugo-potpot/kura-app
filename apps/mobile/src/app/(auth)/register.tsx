import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/register-schema';
import { useRegister } from '@/features/auth/hooks/useRegister';

export default function RegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const { register, isLoading } = useRegister();
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [pendingData, setPendingData] = useState<RegisterFormData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData): void => {
    setPendingData(data);
    setDisclaimerVisible(true);
  };

  const confirmRegister = async (): Promise<void> => {
    if (!pendingData) return;
    setDisclaimerVisible(false);
    setServerError(null);

    try {
      const { totpUri } = await register(pendingData);
      router.push({ pathname: '/(auth)/mfa-setup', params: { totpUri } });
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error?.code === 'EMAIL_ALREADY_EXISTS') {
        setServerError('Un compte existe déjà avec cet email');
      } else {
        setServerError('La création de compte a échoué. Veuillez réessayer.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">
            Créer un compte
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nom complet"
                value={value}
                onChangeText={onChange}
                error={!!errors.name}
                style={styles.input}
                accessibilityLabel="Champ nom complet"
                autoCapitalize="words"
                allowFontScaling
                maxFontSizeMultiplier={1.5}
              />
            )}
          />
          {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                error={!!errors.email}
                style={styles.input}
                accessibilityLabel="Champ email"
                keyboardType="email-address"
                autoCapitalize="none"
                allowFontScaling
                maxFontSizeMultiplier={1.5}
              />
            )}
          />
          {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          {serverError && <Text style={styles.error}>{serverError}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                error={!!errors.password}
                style={styles.input}
                accessibilityLabel="Champ mot de passe"
                secureTextEntry
                allowFontScaling
                maxFontSizeMultiplier={1.5}
              />
            )}
          />
          {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            accessibilityLabel="Bouton créer un compte"
            contentStyle={styles.buttonContent}
          >
            Créer mon compte
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(auth)/login')}
            style={styles.link}
            accessibilityLabel="Lien vers la page de connexion"
          >
            Déjà un compte ? Se connecter
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Modal
          visible={disclaimerVisible}
          onDismiss={() => setDisclaimerVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Avertissement légal
          </Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            L&apos;utilisateur reste seul responsable des informations saisies et validées.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setDisclaimerVisible(false)}
              accessibilityLabel="Bouton annuler"
              style={styles.modalButton}
            >
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={confirmRegister}
              accessibilityLabel="Bouton accepter et créer le compte"
              style={styles.modalButton}
            >
              Accepter
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scroll: { padding: 24, gap: 8 },
  title: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 4 },
  error: { color: '#E53935', fontSize: 12, marginBottom: 8 },
  button: { marginTop: 16, minHeight: 48 },
  buttonContent: { minHeight: 48 },
  link: { marginTop: 8 },
  modal: { backgroundColor: 'white', margin: 24, padding: 24, borderRadius: 8 },
  modalTitle: { marginBottom: 12, fontWeight: 'bold' },
  modalText: { marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { minHeight: 48 },
});
