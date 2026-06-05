import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
} from 'react-native-paper';

import { COLORS } from '@/theme/kura-theme';

import type { UrgencyPatientOption, UrgencySuggestion } from '../hooks/useAddUrgency';
import type { PlanningVisitRow } from '../model/types';

export interface UrgencyBottomSheetProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly candidates: readonly UrgencyPatientOption[];
  readonly onLoadCandidates: () => Promise<void>;
  readonly visits: readonly PlanningVisitRow[];
  readonly suggestInsertion: (
    patient: Pick<UrgencyPatientOption, 'latitude' | 'longitude'>,
    currentVisits: readonly PlanningVisitRow[],
  ) => UrgencySuggestion;
  readonly onConfirmUrgency: (patientId: string, globalInsertIndex: number) => Promise<void>;
}

function initials(first: string, last: string): string {
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  const s = `${a}${b}`.toUpperCase();
  return s.length > 0 ? s : '?';
}

export function UrgencyBottomSheet({
  visible,
  onDismiss,
  candidates,
  onLoadCandidates,
  visits,
  suggestInsertion,
  onConfirmUrgency,
}: UrgencyBottomSheetProps): React.JSX.Element {
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [selected, setSelected] = useState<UrgencyPatientOption | null>(null);
  const [suggestion, setSuggestion] = useState<UrgencySuggestion | null>(null);
  const [manualOrdinal, setManualOrdinal] = useState('1');
  const [busy, setBusy] = useState(false);

  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = Math.round(windowHeight * 0.55);

  useEffect(() => {
    if (visible) {
      void onLoadCandidates();
      setStep('pick');
      setSelected(null);
      setSuggestion(null);
      setManualOrdinal('1');
    }
  }, [visible, onLoadCandidates]);

  const sortedVisits = useMemo(
    () => [...visits].sort((a, b) => a.orderIndex - b.orderIndex),
    [visits],
  );

  const maxPosition = sortedVisits.length + 1;

  const openConfirm = useCallback(
    (p: UrgencyPatientOption): void => {
      const sug = suggestInsertion(p, visits);
      setSelected(p);
      setSuggestion(sug);
      setManualOrdinal(String(sug.globalInsertIndex + 1));
      setStep('confirm');
    },
    [suggestInsertion, visits],
  );

  const parsedManualIndex = Math.max(
    0,
    Math.min(maxPosition - 1, (Number.parseInt(manualOrdinal, 10) || 1) - 1),
  );

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (selected === null) return;
    setBusy(true);
    try {
      await onConfirmUrgency(selected.id, parsedManualIndex);
      onDismiss();
    } finally {
      setBusy(false);
    }
  }, [selected, parsedManualIndex, onConfirmUrgency, onDismiss]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalBox}
        theme={{ roundness: 16 }}
      >
        {step === 'pick' ? (
          <>
            <Text style={styles.title} maxFontSizeMultiplier={1.5}>
              Ajouter une urgence
            </Text>
            <Text style={styles.sub} maxFontSizeMultiplier={1.5}>
              Patients assignés non planifiés aujourd&apos;hui
            </Text>
            <FlatList
              data={[...candidates]}
              keyExtractor={(item) => item.id}
              style={[styles.list, { maxHeight: listMaxHeight }]}
              ListEmptyComponent={
                <Text style={styles.empty} maxFontSizeMultiplier={1.5}>
                  Aucun patient disponible.
                </Text>
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }): object => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => {
                    openConfirm(item);
                  }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText} maxFontSizeMultiplier={1.5}>
                      {initials(item.firstName, item.lastName)}
                    </Text>
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.name} maxFontSizeMultiplier={1.5}>
                      {`${item.firstName} ${item.lastName}`.trim()}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
            <Button mode="outlined" onPress={onDismiss} style={styles.btnMargin}>
              Fermer
            </Button>
          </>
        ) : (
          <>
            <Text style={styles.title} maxFontSizeMultiplier={1.5}>
              Confirmer l&apos;urgence
            </Text>
            {selected !== null && (
              <Text style={styles.sub} maxFontSizeMultiplier={1.5}>
                {`${selected.firstName} ${selected.lastName}`.trim()}
              </Text>
            )}
            {suggestion !== null && (
              <Text style={styles.suggestion} maxFontSizeMultiplier={1.5}>
                {suggestion.afterPatientName !== null
                  ? `Position optimale : après ${suggestion.afterPatientName}`
                  : 'Position optimale : en tête de la tournée'}
              </Text>
            )}
            <Text style={styles.manualLabel} maxFontSizeMultiplier={1.5}>
              Insérer en position (1 à {maxPosition})
            </Text>
            <TextInput
              mode="outlined"
              keyboardType="number-pad"
              value={manualOrdinal}
              onChangeText={setManualOrdinal}
              dense
              style={styles.input}
            />
            <View style={styles.actions}>
              <Button mode="outlined" onPress={() => setStep('pick')} disabled={busy}>
                Retour
              </Button>
              <Button
                mode="contained"
                buttonColor={COLORS.primary}
                loading={busy}
                onPress={() => {
                  void handleConfirm();
                }}
                disabled={busy || selected === null}
                style={styles.confirmBtn}
              >
                Confirmer
              </Button>
            </View>
          </>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalBox: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 56 : 32,
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
    padding: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  suggestion: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  manualLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  list: { marginBottom: 8 },
  empty: { padding: 16, color: COLORS.textMuted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  rowPressed: { opacity: 0.92 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', color: COLORS.primary, fontSize: 14 },
  rowMain: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  btnMargin: { marginTop: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  confirmBtn: { borderRadius: 12, minWidth: 120 },
});
