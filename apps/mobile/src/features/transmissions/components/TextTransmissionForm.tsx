import { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/theme/kura-theme';
import { usePatients } from '@/features/patients/hooks/usePatients';
import {
  CARE_TYPES,
  CARE_TYPE_LABELS,
  CARE_TYPE_TEMPLATES,
  type CareType,
} from '../services/care-type-templates';
import { useTextTransmission } from '../hooks/useTextTransmission';

interface TextTransmissionFormProps {
  patientId: string | null;
  onSaved?: (id: string) => void;
}

const CHIP_ICONS: Record<CareType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  toilette: 'shower-head',
  pansement: 'bandage',
  injection: 'needle',
  constantes: 'heart-pulse',
  autre: 'note-text-outline',
};

export function TextTransmissionForm({
  patientId,
  onSaved,
}: TextTransmissionFormProps): React.JSX.Element {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientId);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CareType | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const { saveStatus, save, reset } = useTextTransmission();

  const { data: patients = [] } = usePatients({ status: 'active' });
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const effectivePatientId = selectedPatientId ?? patientId;

  const handleTypeSelect = (type: CareType) => {
    setSelectedType(type);
    setFieldValues({});
    reset();
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!effectivePatientId || !selectedType) return;
    const id = await save(effectivePatientId, selectedType, fieldValues);
    if (id !== null) {
      onSaved?.(id);
    }
  };

  const hasContent =
    selectedType !== null &&
    Object.values(fieldValues).some((v) => v.trim().length > 0);

  const isDone = saveStatus === 'done';
  const isSaving = saveStatus === 'saving';

  if (isDone) {
    return (
      <View style={styles.successContainer}>
        <MaterialCommunityIcons name="check-circle" size={56} color={COLORS.teal} />
        <Text style={styles.successTitle}>Transmission enregistrée</Text>
        <Text style={styles.successSub}>Sauvegardée localement, sera synchronisée dès la prochaine connexion.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sélecteur de patient — affiché seulement si patientId non fourni par le parent */}
      {patientId === null && (
        <View style={styles.patientSection}>
          <Text style={styles.sectionLabel}>Patient</Text>
          <Pressable
            style={styles.patientPicker}
            onPress={() => setPatientPickerOpen((o) => !o)}
          >
            <MaterialCommunityIcons
              name="account"
              size={18}
              color={effectivePatientId ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.patientPickerText, !effectivePatientId && styles.patientPickerPlaceholder]}>
              {selectedPatient
                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                : 'Sélectionner un patient…'}
            </Text>
            <MaterialCommunityIcons
              name={patientPickerOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textMuted}
            />
          </Pressable>

          {patientPickerOpen && (
            <View style={styles.patientList}>
              {patients.length === 0 && (
                <Text style={styles.patientListEmpty}>Aucun patient actif</Text>
              )}
              {patients.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.patientListItem,
                    selectedPatientId === p.id && styles.patientListItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPatientId(p.id);
                    setPatientPickerOpen(false);
                  }}
                >
                  <Text style={[
                    styles.patientListItemText,
                    selectedPatientId === p.id && styles.patientListItemTextSelected,
                  ]}>
                    {p.firstName} {p.lastName}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Chips de type de soin */}
      <Text style={styles.sectionLabel}>Type de soin</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CARE_TYPES.map((type) => (
          <Chip
            key={type}
            selected={selectedType === type}
            onPress={() => handleTypeSelect(type)}
            style={[styles.chip, selectedType === type && styles.chipSelected]}
            textStyle={[styles.chipText, selectedType === type && styles.chipTextSelected]}
            icon={() => (
              <MaterialCommunityIcons
                name={CHIP_ICONS[type]}
                size={15}
                color={selectedType === type ? '#fff' : COLORS.primary}
              />
            )}
            compact
          >
            {CARE_TYPE_LABELS[type]}
          </Chip>
        ))}
      </ScrollView>

      {/* Champs du template */}
      {selectedType !== null && (
        <View style={styles.fields}>
          {CARE_TYPE_TEMPLATES[selectedType].map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={[styles.fieldInput, field.multiline === true && styles.fieldInputMulti]}
                value={fieldValues[field.key] ?? ''}
                onChangeText={(v) => handleFieldChange(field.key, v)}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textMuted}
                multiline={field.multiline}
                numberOfLines={field.multiline === true ? 3 : 1}
                textAlignVertical={field.multiline === true ? 'top' : 'center'}
                returnKeyType={field.multiline === true ? 'default' : 'next'}
              />
            </View>
          ))}

          <Button
            mode="contained"
            onPress={() => { void handleSave(); }}
            loading={isSaving}
            disabled={isSaving || !hasContent || !effectivePatientId}
            buttonColor={COLORS.teal}
            icon="check-circle-outline"
            style={styles.saveBtn}
          >
            {!effectivePatientId ? 'Sélectionnez un patient' : 'Enregistrer la transmission'}
          </Button>

          {saveStatus === 'error' && (
            <Text style={styles.errorText}>Erreur d'enregistrement — réessayez</Text>
          )}
        </View>
      )}

      {selectedType === null && (
        <View style={styles.emptyHint}>
          <MaterialCommunityIcons name="gesture-tap" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyHintText}>Sélectionnez un type de soin pour afficher le formulaire</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  patientSection: { gap: 6 },
  patientPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  patientPickerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  patientPickerPlaceholder: {
    color: COLORS.textMuted,
  },
  patientList: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    maxHeight: 200,
  },
  patientListEmpty: {
    padding: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  patientListItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  patientListItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  patientListItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  patientListItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.primary,
  },
  chipTextSelected: {
    color: '#fff',
  },
  fields: {
    gap: 14,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  fieldInput: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 44,
  },
  fieldInputMulti: {
    minHeight: 80,
  },
  saveBtn: {
    marginTop: 6,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
  },
  emptyHint: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyHintText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.teal,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
