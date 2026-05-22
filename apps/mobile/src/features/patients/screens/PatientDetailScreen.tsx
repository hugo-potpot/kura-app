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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePatient } from '../hooks/usePatient';
import { useUpdatePatient, type UpdatePatientInput } from '../hooks/useUpdatePatient';
import { useArchivePatient } from '../hooks/useArchivePatient';
import { useDeletePatient } from '../hooks/useDeletePatient';
import { useVitalSigns, type VitalSignRange } from '../hooks/useVitalSigns';
import { AddressAutocomplete, type AddressCoords } from '../components/AddressAutocomplete';
import { ConstantesLineChart, type ChartDataPoint } from '../components/ConstantesLineChart';
import { NewTransmissionSheet } from '@/features/transmissions/components/NewTransmissionSheet';
import { useTransmissions } from '@/features/transmissions/hooks/useTransmissions';
import { CARE_TYPE_LABELS } from '@/features/transmissions/services/care-type-templates';
import { COLORS } from '@/theme/kura-theme';

type ConstanteKey = 'tension' | 'glycemia' | 'weight' | 'temperature' | 'spo2';

interface ConstanteConfig {
  label: string;
  field: 'systolic' | 'glycemia' | 'weight' | 'temperature' | 'spo2';
  unit: string;
  normalRange?: { min: number; max: number };
  alertRange?: { min: number; max: number };
}

const CONSTANTE_CONFIG: Record<ConstanteKey, ConstanteConfig> = {
  tension:     { label: 'Tension',      field: 'systolic',    unit: 'mmHg',   normalRange: { min: 90,  max: 139 }, alertRange: { min: 80,  max: 180 } },
  glycemia:    { label: 'Glycémie',     field: 'glycemia',    unit: 'mmol/L', normalRange: { min: 3.9, max: 7.8 }, alertRange: { min: 2.5, max: 11.0 } },
  weight:      { label: 'Poids',        field: 'weight',      unit: 'kg' },
  temperature: { label: 'Température',  field: 'temperature', unit: '°C',     normalRange: { min: 36.0, max: 37.5 }, alertRange: { min: 35.0, max: 38.5 } },
  spo2:        { label: 'SpO2',         field: 'spo2',        unit: '%',      normalRange: { min: 95, max: 100 },    alertRange: { min: 90, max: 100 } },
};

const RANGE_LABELS: Record<VitalSignRange, string> = {
  '7d':  '7 j',
  '30d': '30 j',
  '6m':  '6 mois',
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

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
  const [selectedConstante, setSelectedConstante] = useState<ConstanteKey>('tension');
  const [selectedRange, setSelectedRange] = useState<VitalSignRange>('30d');
  const [transmissionSheetVisible, setTransmissionSheetVisible] = useState(false);

  const { data: vitalSignsData, isLoading: isLoadingVS } = useVitalSigns(patientId, selectedRange);
  const { data: patientTransmissions = [] } = useTransmissions(patientId, 'all');

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
          } else {
            setSnackbarMessage('Fiche patient mise à jour avec succès.');
          }
          setSnackbarVisible(true);
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
        <ActivityIndicator size="large" color={COLORS.primary} accessibilityLabel="Chargement de la fiche patient" />
      </SafeAreaView>
    );
  }

  if (isError || !patient) {
    return (
      <SafeAreaView style={styles.centered}>
        <MaterialCommunityIcons name="account-off-outline" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
        <Text variant="bodyLarge" style={styles.errorText}>Patient introuvable</Text>
        <Button mode="text" onPress={() => router.back()} textColor={COLORS.primary}>
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero header */}
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(patient.firstName, patient.lastName)}</Text>
            </View>
            <Text style={styles.heroName}>{patient.firstName} {patient.lastName}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, patient.status === 'active' ? styles.badgeActive : styles.badgeArchived]}>
                <Text style={[styles.badgeText, patient.status === 'active' ? styles.badgeActiveText : styles.badgeArchivedText]}>
                  {patient.status === 'active' ? 'Actif' : 'Archivé'}
                </Text>
              </View>
              {patient.latitude === null && (
                <View style={[styles.badge, styles.badgeWarning]}>
                  <MaterialCommunityIcons name="map-marker-alert-outline" size={11} color="#92400E" style={{ marginRight: 3 }} />
                  <Text style={[styles.badgeText, styles.badgeWarningText]}>Non géolocalisé</Text>
                </View>
              )}
            </View>
          </View>

          {/* Section : Informations personnelles */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Informations personnelles</Text>
            </View>

            {isEditing ? (
              <View style={styles.cardBody}>
                <TextInput
                  label="Prénom"
                  value={form.firstName ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  mode="outlined"
                  style={styles.input}
                  outlineColor={COLORS.inputBg}
                  activeOutlineColor={COLORS.primary}
                />
                <TextInput
                  label="Nom"
                  value={form.lastName ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  mode="outlined"
                  style={styles.input}
                  outlineColor={COLORS.inputBg}
                  activeOutlineColor={COLORS.primary}
                />
                <TextInput
                  label="Téléphone"
                  value={form.phone ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: v || null }))}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  outlineColor={COLORS.inputBg}
                  activeOutlineColor={COLORS.primary}
                />
              </View>
            ) : (
              <View style={styles.cardBody}>
                <FieldRow icon="badge-account-horizontal-outline" label="Prénom" value={displayValue(patient.firstName)} />
                <FieldRow icon="badge-account-horizontal-outline" label="Nom" value={displayValue(patient.lastName)} />
                <FieldRow icon="phone-outline" label="Téléphone" value={displayValue(patient.phone)} />
              </View>
            )}
          </View>

          {/* Section : Adresse */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Adresse</Text>
            </View>
            <View style={styles.cardBody}>
              {isEditing ? (
                <AddressAutocomplete
                  value={form.address ?? ''}
                  onChange={(v) => { setForm((f) => ({ ...f, address: v })); setAddressCoords(null); }}
                  onCoordinates={setAddressCoords}
                />
              ) : (
                <FieldRow icon="home-outline" label="Adresse" value={displayValue(patient.address)} />
              )}
              {patient.latitude === null && !isEditing && (
                <View style={styles.warningBanner}>
                  <MaterialCommunityIcons name="information-outline" size={14} color="#92400E" />
                  <Text style={styles.warningText}>
                    Adresse non géolocalisée — ce patient sera placé en fin de planning.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Section : Médecin traitant */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="stethoscope" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Médecin traitant</Text>
            </View>
            <View style={styles.cardBody}>
              {isEditing ? (
                <TextInput
                  label="Médecin traitant"
                  value={form.treatingDoctor ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, treatingDoctor: v || null }))}
                  mode="outlined"
                  style={styles.input}
                  outlineColor={COLORS.inputBg}
                  activeOutlineColor={COLORS.primary}
                />
              ) : (
                <FieldRow icon="doctor" label="Médecin" value={displayValue(patient.treatingDoctor)} />
              )}
            </View>
          </View>

          {/* Section : Constantes vitales */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="heart-pulse" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Constantes vitales</Text>
            </View>
            <View style={styles.cardBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <View style={styles.chipsRow}>
                  {(Object.keys(CONSTANTE_CONFIG) as ConstanteKey[]).map((key) => (
                    <Chip
                      key={key}
                      compact
                      selected={selectedConstante === key}
                      onPress={() => setSelectedConstante(key)}
                      selectedColor={COLORS.primary}
                      style={[styles.selectorChip, selectedConstante === key && styles.selectorChipActive]}
                    >
                      {CONSTANTE_CONFIG[key]?.label ?? key}
                    </Chip>
                  ))}
                </View>
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <View style={styles.chipsRow}>
                  {(Object.keys(RANGE_LABELS) as VitalSignRange[]).map((range) => (
                    <Chip
                      key={range}
                      compact
                      selected={selectedRange === range}
                      onPress={() => setSelectedRange(range)}
                      selectedColor={COLORS.primary}
                      style={[styles.selectorChip, selectedRange === range && styles.selectorChipActive]}
                    >
                      {RANGE_LABELS[range]}
                    </Chip>
                  ))}
                </View>
              </ScrollView>

              {isLoadingVS ? (
                <View style={styles.chartLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <ConstantesLineChart
                  dataPoints={
                    (vitalSignsData ?? [])
                      .filter((vs) => {
                        const cfg = CONSTANTE_CONFIG[selectedConstante];
                        return cfg && vs[cfg.field] !== null;
                      })
                      .map((vs): ChartDataPoint => {
                        const cfg = CONSTANTE_CONFIG[selectedConstante];
                        return {
                          value: (vs[cfg?.field ?? 'systolic'] as number) ?? 0,
                          date: vs.measuredAt,
                        };
                      })
                  }
                  unit={CONSTANTE_CONFIG[selectedConstante]?.unit ?? ''}
                  label={CONSTANTE_CONFIG[selectedConstante]?.label ?? ''}
                  normalRange={CONSTANTE_CONFIG[selectedConstante]?.normalRange}
                  alertRange={CONSTANTE_CONFIG[selectedConstante]?.alertRange}
                />
              )}
            </View>
          </View>

          {/* Section : Transmissions */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Transmissions</Text>
              <View style={{ flex: 1 }} />
              <Button
                mode="text"
                compact
                icon="plus"
                onPress={() => setTransmissionSheetVisible(true)}
                textColor={COLORS.primary}
              >
                Ajouter
              </Button>
            </View>
            <View style={styles.cardBody}>
              {patientTransmissions.length === 0 ? (
                <Text style={styles.txEmpty}>Aucune transmission pour ce patient.</Text>
              ) : (
                patientTransmissions.slice(0, 5).map((tx) => (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <Text style={styles.txType}>{CARE_TYPE_LABELS[tx.careType] ?? tx.careType}</Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                        })} · {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.txContent} numberOfLines={2}>{tx.contentValidated}</Text>
                  </View>
                ))
              )}
              {patientTransmissions.length > 5 && (
                <Text style={styles.txMore}>+ {patientTransmissions.length - 5} autre{patientTransmissions.length - 5 > 1 ? 's' : ''}</Text>
              )}
            </View>
          </View>

          {/* Actions */}
          {isEditing ? (
            <View style={styles.editActions}>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isPending}
                disabled={isPending}
                style={styles.saveButton}
                contentStyle={styles.buttonContent}
              >
                Enregistrer
              </Button>
              <Button
                mode="outlined"
                onPress={cancelEditing}
                disabled={isPending}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
                textColor={COLORS.textSecondary}
              >
                Annuler
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              icon="pencil-outline"
              onPress={startEditing}
              style={styles.editButton}
              contentStyle={styles.buttonContent}
            >
              Modifier la fiche
            </Button>
          )}

          {/* Zone dangereuse */}
          {!isEditing && (
            <View style={styles.dangerZone}>
              <View style={styles.dangerHeader}>
                <MaterialCommunityIcons name="alert-outline" size={14} color={COLORS.error} />
                <Text style={styles.dangerTitle}>Attention !</Text>
              </View>
              <View style={styles.dangerActions}>
                {patient.status === 'active' && (
                  <Button
                    mode="outlined"
                    icon="archive-outline"
                    onPress={() => setShowArchiveDialog(true)}
                    textColor={COLORS.warningText}
                    style={styles.dangerBtn}
                    contentStyle={styles.dangerBtnContent}
                  >
                    Archiver
                  </Button>
                )}
                <Button
                  mode="outlined"
                  icon="delete-outline"
                  onPress={() => { setDeleteConfirmName(''); setShowDeleteDialog(true); }}
                  textColor={COLORS.error}
                  style={[styles.dangerBtn, styles.deleteBtn]}
                  contentStyle={styles.dangerBtnContent}
                >
                  Supprimer
                </Button>
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={showArchiveDialog} onDismiss={() => setShowArchiveDialog(false)} style={styles.dialog}>
          <Dialog.Title>Archiver ce patient ?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: COLORS.textSecondary }}>
              Le patient sera retiré du planning actif. Son dossier restera accessible depuis la liste &quot;Archivés&quot;.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowArchiveDialog(false)} textColor={COLORS.textSecondary}>Annuler</Button>
            <Button onPress={handleArchiveConfirm} loading={archiveMutation.isPending} textColor={COLORS.warningText}>
              Confirmer
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)} style={styles.dialog}>
          <Dialog.Title style={{ color: COLORS.error }}>Suppression définitive</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={{ color: COLORS.error, marginBottom: 12 }}>
              Cette action est irréversible.
            </Text>
            <Text variant="bodyMedium" style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
              Tapez <Text style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{patient.firstName} {patient.lastName}</Text> pour confirmer :
            </Text>
            <RNTextInput
              value={deleteConfirmName}
              onChangeText={setDeleteConfirmName}
              placeholder={`${patient.firstName} ${patient.lastName}`}
              style={styles.confirmInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={COLORS.textSecondary}>Annuler</Button>
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

        <Dialog visible={showRetentionDialog} onDismiss={() => setShowRetentionDialog(false)} style={styles.dialog}>
          <Dialog.Title>Avertissement RGPD</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: COLORS.textSecondary }}>
              Ce patient a des transmissions de moins de 10 ans. La réglementation impose une conservation de 10 ans.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShowRetentionDialog(false); setShowArchiveDialog(true); }} textColor={COLORS.warningText}>
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

      <NewTransmissionSheet
        visible={transmissionSheetVisible}
        patientId={patientId}
        patientName={patient ? `${patient.firstName} ${patient.lastName}` : undefined}
        onClose={() => setTransmissionSheetVisible(false)}
        onSaved={() => setTransmissionSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function FieldRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <MaterialCommunityIcons name={icon as 'home'} size={15} color={COLORS.textMuted} style={styles.fieldIcon} />
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.background },
  errorText: { color: COLORS.textSecondary, marginBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 0 },

  // Hero
  hero: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeActiveText: { color: '#15803D' },
  badgeArchived: { backgroundColor: '#FFEDD5' },
  badgeArchivedText: { color: '#C2410C' },
  badgeWarning: { backgroundColor: '#FEF3C7' },
  badgeWarningText: { color: '#92400E' },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EFF5',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFCFF',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardBody: {
    padding: 16,
    gap: 4,
  },

  // Field rows
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  fieldIcon: {
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '400',
  },

  // Inputs
  input: {
    marginBottom: 8,
    backgroundColor: COLORS.white,
    fontSize: 14,
  },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },

  // Chips
  chipsScroll: { marginBottom: 8 },
  chipsRow: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  selectorChip: { backgroundColor: '#F1F5F9' },
  selectorChipActive: { backgroundColor: '#EEF2FF' },
  chartLoadingContainer: { paddingVertical: 24, alignItems: 'center' },

  // Action buttons
  editButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginBottom: 12,
  },
  editActions: {
    gap: 10,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: '#CBD5E1',
  },
  buttonContent: {
    paddingVertical: 4,
  },

  // Transmissions
  txEmpty: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 8 },
  txRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
    gap: 4,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  txType: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  txDate: { fontSize: 11, color: COLORS.textMuted },
  txContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  txMore: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingTop: 8 },

  // Danger zone
  dangerZone: {
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFF5F5',
    marginBottom: 12,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dangerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  dangerBtn: {
    borderRadius: 10,
    borderColor: '#FDBA74',
    flex: 1,
  },
  dangerBtnContent: {
    paddingVertical: 2,
  },
  deleteBtn: {
    borderColor: '#FCA5A5',
  },

  // Dialogs
  dialog: {
    borderRadius: 20,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFF',
    marginTop: 4,
  },
});
