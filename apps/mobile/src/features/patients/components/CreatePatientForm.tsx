import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';

import { type CreatePatientInput } from '../hooks/useCreatePatient';
import { AddressAutocomplete, type AddressCoords } from './AddressAutocomplete';

interface Props {
  structureId: string;
  onSubmit: (input: CreatePatientInput) => void;
  isLoading: boolean;
  error: string | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  treatingDoctor: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'Prénom requis';
  if (!form.lastName.trim()) errors.lastName = 'Nom requis';
  if (form.address.trim().length < 5) errors.address = 'Adresse trop courte (5 caractères min.)';
  return errors;
}

export function CreatePatientForm({ structureId, onSubmit, isLoading, error }: Props): React.JSX.Element {
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    treatingDoctor: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [addressCoords, setAddressCoords] = useState<AddressCoords | null>(null);

  function update(field: keyof FormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched) setErrors(validate({ ...form, [field]: value }));
  }

  function handleSubmit(): void {
    setTouched(true);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      structureId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || undefined,
      treatingDoctor: form.treatingDoctor.trim() || undefined,
      ...(addressCoords ? { latitude: addressCoords.lat, longitude: addressCoords.lng } : {}),
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        label="Prénom *"
        value={form.firstName}
        onChangeText={(v) => update('firstName', v)}
        style={styles.input}
        error={!!errors.firstName}
        accessibilityLabel="Champ prénom"
      />
      <HelperText type="error" visible={!!errors.firstName}>
        {errors.firstName}
      </HelperText>

      <TextInput
        label="Nom *"
        value={form.lastName}
        onChangeText={(v) => update('lastName', v)}
        style={styles.input}
        error={!!errors.lastName}
        accessibilityLabel="Champ nom"
      />
      <HelperText type="error" visible={!!errors.lastName}>
        {errors.lastName}
      </HelperText>

      <AddressAutocomplete
        value={form.address}
        onChange={(v) => update('address', v)}
        onCoordinates={setAddressCoords}
        hasError={!!errors.address}
      />
      <HelperText type="error" visible={!!errors.address}>
        {errors.address}
      </HelperText>

      <TextInput
        label="Téléphone"
        value={form.phone}
        onChangeText={(v) => update('phone', v)}
        keyboardType="phone-pad"
        style={styles.input}
        accessibilityLabel="Champ téléphone"
      />

      <TextInput
        label="Médecin traitant"
        value={form.treatingDoctor}
        onChangeText={(v) => update('treatingDoctor', v)}
        style={styles.input}
        accessibilityLabel="Champ médecin traitant"
      />

      {error && (
        <Text style={styles.globalError}>{error}</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
        accessibilityLabel="Bouton créer le patient"
      >
        Créer le patient
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 2 },
  input: { backgroundColor: 'transparent' },
  globalError: { color: '#E53935', fontSize: 13, marginVertical: 8 },
  button: { marginTop: 16, minHeight: 48 },
  buttonContent: { minHeight: 48 },
});
