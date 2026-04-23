import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Snackbar,
  ActivityIndicator,
  Chip,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePatient } from '../hooks/usePatient';
import { useUpdatePatient, type UpdatePatientInput } from '../hooks/useUpdatePatient';
import { useArchivePatient } from '../hooks/useArchivePatient';
import { useDeletePatient } from '../hooks/useDeletePatient';
import { AddressAutocomplete, type AddressCoords } from '../components/AddressAutocomplete';
import { COLORS } from '@/theme/kura-theme';

interface Props {
  patientId: string;
}

export function PatientDetailScreen({ patientId }: Props): React.JSX.Element {
  const router = useRouter();
  const { data: patient, isLoading, isError } = usePatient(patientId);
  const { mutate: updatePatient, isPending } = useUpdatePatient();
  const archiveMutation = useArchivePatient();
  const deleteMutation = useDeletePatient();

  const [isEditing, setIsEditing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [addressCoords, setAddressCoords] = useState<AddressCoords | null>(null);

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [form, setForm] = useState<Omit<UpdatePatientInput, 'id'>>({});

  function startEditing() {
    if (!patient) return;
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      address: patient.address,
      phone: patient.phone ?? '',
      treatingDoctor: patient.treatingDoctor ?? '',
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setForm({});
    setAddressCoords(null);
    setIsEditing(false);
  }

  function handleArchiveConfirm() {
    archiveMutation.mutate(patientId, {
      onSuccess: () => {
        setShowArchiveDialog(false);
        router.back();
      },
      onError: () => {
        setShowArchiveDialog(false);
        setSnackbarMessage("Erreur lors de l'archivage. Veuillez réessayer.");
        setSnackbarVisible(true);
      },
    });
  }

  function handleDeleteConfirm(force: boolean) {
    deleteMutation.mutate(
      { patientId, force },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setShowRetentionDialog(false);
          setSnackbarMessage('Patient supprimé définitivement.');
          setSnackbarVisible(true);
          setTimeout(() => router.back(), 1200);
        },
        onError: (err) => {
          if (err.message === 'RETENTION_WARNING') {
            setShowDeleteDialog(false);
            setShowRetentionDialog(true);
          } else {
            setShowDeleteDialog(false);
            setSnackbarMessage('Erreur lors de la suppression. Veuillez réessayer.');
            setSnackbarVisible(true);
          }
        },
      },
    );
  }

  function handleSave() {
    if (!patient) return;
    const payload = addressCoords
      ? { ...form, latitude: addressCoords.lat, longitude: addressCoords.lng }
      : form;
    updatePatient(
      { id: patientId, ...payload },
      {
        onSuccess: (updated) => {
          setIsEditing(false);
          setForm({});
          setAddressCoords(null);
          if (updated.latitude === null) {
            setSnackbarMessage('Adresse non géolocalisée — ce patient sera placé en fin de planning.');
            setSnackbarVisible(true);
          } else {
            setSnackbarMessage('Fiche patient mise à jour avec succès.');
            setSnackbarVisible(true);
          }
        },
        onError: () => {
          setSnackbarMessage('Erreur lors de la sauvegarde. Veuillez réessayer.');
          setSnackbarVisible(true);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" accessibilityLabel="Chargement de la fiche patient" />
      </SafeAreaView>
    );
  }

  if (isError || !patient) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text variant="bodyLarge" style={styles.errorText}>Patient introuvable.</Text>
        <Button
          mode="text"
          onPress={() => router.back()}
          accessibilityLabel="Retour à la liste des patients"
        >
          Retour
        </Button>
      </SafeAreaView>
    );
  }

  const displayValue = (v: string | null | undefined) => v ?? '—';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text
              variant="headlineSmall"
              style={styles.name}
              allowFontScaling
              maxFontSizeMultiplier={1.5}
            >
              {patient.firstName} {patient.lastName}
            </Text>
            <View style={styles.badges}>
              <Chip
                compact
                style={patient.status === 'active' ? styles.activeChip : styles.archivedChip}
                textStyle={patient.status === 'active' ? styles.activeChipText : styles.archivedChipText}
              >
                {patient.status === 'active' ? 'Actif' : 'Archivé'}
              </Chip>
              {patient.latitude === null && (
                <Chip compact style={styles.warningChip} textStyle={styles.warningChipText}>
                  Adresse non géolocalisée
                </Chip>
              )}
            </View>
          </View>

          {/* Section : Informations personnelles */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Informations personnelles</Text>

            {isEditing ? (
              <>
                <TextInput
                  label="Prénom"
                  value={form.firstName ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  mode="outlined"
                  style={styles.input}
                  accessibilityLabel="Prénom du patient"
                  allowFontScaling
                  maxFontSizeMultiplier={1.5}
                />
                <TextInput
                  label="Nom"
                  value={form.lastName ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  mode="outlined"
                  style={styles.input}
                  accessibilityLabel="Nom du patient"
                  allowFontScaling
                  maxFontSizeMultiplier={1.5}
                />
                <TextInput
                  label="Téléphone"
                  value={form.phone ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: v || null }))}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  accessibilityLabel="Téléphone du patient"
                  allowFontScaling
                  maxFontSizeMultiplier={1.5}
                />
              </>
            ) : (
              <>
                <LabelValue label="Prénom" value={displayValue(patient.firstName)} />
                <LabelValue label="Nom" value={displayValue(patient.lastName)} />
                <LabelValue label="Téléphone" value={displayValue(patient.phone)} />
              </>
            )}
          </View>

          {/* Section : Adresse */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Adresse</Text>
            {isEditing ? (
              <AddressAutocomplete
                value={form.address ?? ''}
                onChange={(v) => { setForm((f) => ({ ...f, address: v })); setAddressCoords(null); }}
                onCoordinates={setAddressCoords}
              />
            ) : (
              <LabelValue label="Adresse" value={displayValue(patient.address)} />
            )}
            <LabelValue
              label="Coordonnées GPS"
              value={
                addressCoords
                  ? `${addressCoords.lat.toFixed(5)}, ${addressCoords.lng.toFixed(5)}`
                  : patient.latitude !== null && patient.longitude !== null
                    ? `${patient.latitude.toFixed(5)}, ${patient.longitude.toFixed(5)}`
                    : '—'
              }
            />
          </View>

          {/* Section : Médecin traitant */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Médecin traitant</Text>
            {isEditing ? (
              <TextInput
                label="Médecin traitant"
                value={form.treatingDoctor ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, treatingDoctor: v || null }))}
                mode="outlined"
                style={styles.input}
                accessibilityLabel="Médecin traitant du patient"
                allowFontScaling
                maxFontSizeMultiplier={1.5}
              />
            ) : (
              <LabelValue label="Médecin" value={displayValue(patient.treatingDoctor)} />
            )}
          </View>

          {/* Actions édition */}
          <View style={styles.actions}>
            {isEditing ? (
              <>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={isPending}
                  disabled={isPending}
                  style={styles.saveButton}
                  accessibilityLabel="Sauvegarder les modifications du patient"
                >
                  Sauvegarder
                </Button>
                <Button
                  mode="outlined"
                  onPress={cancelEditing}
                  disabled={isPending}
                  accessibilityLabel="Annuler les modifications"
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={startEditing}
                style={styles.editButton}
                accessibilityLabel="Modifier la fiche patient"
              >
                Modifier
              </Button>
            )}
          </View>

          {/* Zone actions dangereuses */}
          {!isEditing && (
            <View style={styles.dangerZone}>
              <Text variant="labelSmall" style={styles.dangerZoneTitle}>ZONE DANGEREUSE</Text>
              {patient.status === 'active' && (
                <Button
                  mode="outlined"
                  onPress={() => setShowArchiveDialog(true)}
                  textColor={COLORS.warningText}
                  style={styles.dangerButton}
                  icon="archive-outline"
                  accessibilityLabel="Archiver ce patient"
                >
                  Archiver ce patient
                </Button>
              )}
              <Button
                mode="outlined"
                onPress={() => { setDeleteConfirmName(''); setShowDeleteDialog(true); }}
                textColor={COLORS.error}
                style={[styles.dangerButton, styles.deleteButton]}
                icon="delete-outline"
                accessibilityLabel="Supprimer définitivement ce patient"
              >
                Supprimer définitivement
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dialogs */}
      <Portal>
        {/* Archive */}
        <Dialog visible={showArchiveDialog} onDismiss={() => setShowArchiveDialog(false)}>
          <Dialog.Title>Archiver ce patient ?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Le patient sera retiré du planning actif. Son dossier restera accessible en lecture depuis la liste &quot;Archivés&quot;.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowArchiveDialog(false)}>Annuler</Button>
            <Button onPress={handleArchiveConfirm} loading={archiveMutation.isPending}>
              Confirmer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete — saisie du nom */}
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Supprimer définitivement ?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={{ color: COLORS.error, marginBottom: 12 }}>
              Cette action est irréversible — toutes les données seront supprimées.
            </Text>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Tapez{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {patient.firstName} {patient.lastName}
              </Text>{' '}
              pour confirmer :
            </Text>
            <RNTextInput
              value={deleteConfirmName}
              onChangeText={setDeleteConfirmName}
              placeholder={`${patient.firstName} ${patient.lastName}`}
              style={styles.confirmInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button
              textColor={COLORS.error}
              disabled={
                deleteConfirmName.trim().toLowerCase() !==
                `${patient.firstName} ${patient.lastName}`.toLowerCase() ||
                deleteMutation.isPending
              }
              loading={deleteMutation.isPending}
              onPress={() => handleDeleteConfirm(false)}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Retention warning */}
        <Dialog visible={showRetentionDialog} onDismiss={() => setShowRetentionDialog(false)}>
          <Dialog.Title>Avertissement RGPD</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Ce patient a des transmissions de moins de 10 ans. La réglementation impose une conservation de 10 ans.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShowRetentionDialog(false); setShowArchiveDialog(true); }}>
              Archiver plutôt
            </Button>
            <Button
              textColor={COLORS.error}
              loading={deleteMutation.isPending}
              onPress={() => handleDeleteConfirm(true)}
            >
              Supprimer quand même
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.labelValue}>
      <Text
        variant="labelSmall"
        style={styles.label}
        allowFontScaling
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={styles.value}
        allowFontScaling
        maxFontSizeMultiplier={1.5}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginBottom: 12, color: '#64748b' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  name: { fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  activeChip: { backgroundColor: '#dcfce7' },
  activeChipText: { color: '#15803d', fontSize: 11 },
  archivedChip: { backgroundColor: '#ffedd5' },
  archivedChipText: { color: '#c2410c', fontSize: 11 },
  warningChip: { backgroundColor: '#fef3c7' },
  warningChipText: { color: '#92400e', fontSize: 11 },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { color: '#475569', marginBottom: 12, fontWeight: '600' },
  input: { marginBottom: 8, backgroundColor: '#ffffff' },
  labelValue: { marginBottom: 10 },
  label: { color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: '#1e293b' },
  actions: { gap: 10, marginTop: 8 },
  saveButton: { backgroundColor: '#1e2d6b' },
  editButton: { backgroundColor: '#1e2d6b' },
  dangerZone: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff5f5',
    gap: 10,
  },
  dangerZoneTitle: {
    color: '#ef4444',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dangerButton: {
    borderColor: COLORS.warningText,
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
});
