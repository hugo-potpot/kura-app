import { StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCreatePatient, type CreatePatientInput } from '../hooks/useCreatePatient';
import { CreatePatientForm } from '../components/CreatePatientForm';

const PLACEHOLDER_STRUCTURE_ID = 'local';

export function NewPatientScreen(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { mutate, isPending, error } = useCreatePatient();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const structureId = (user as { structureId?: string } | null)?.structureId ?? PLACEHOLDER_STRUCTURE_ID;

  function handleSubmit(input: CreatePatientInput): void {
    mutate(input, {
      onSuccess: (patient) => {
        if (patient.latitude === null) {
          setSnackbarMessage('Adresse non géolocalisée — ce patient sera placé en fin de planning');
          setSnackbarVisible(true);
          setTimeout(() => router.back(), 3000);
        } else {
          router.back();
        }
      },
      onError: () => {
        setSnackbarMessage('Erreur lors de la création du patient');
        setSnackbarVisible(true);
      },
    });
  }

  const errorMessage = error instanceof Error ? error.message : error ? 'Une erreur est survenue' : null;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Nouveau Patient</Text>

      <CreatePatientForm
        structureId={structureId}
        onSubmit={handleSubmit}
        isLoading={isPending}
        error={errorMessage}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
});
