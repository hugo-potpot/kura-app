import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Text, Button, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/theme/kura-theme';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { TranscriptionViewer } from './TranscriptionViewer';
import { TextTransmissionForm } from './TextTransmissionForm';
import { useVoiceTransmission } from '../hooks/useVoiceTransmission';
import { useTransmissionPreferences } from '../hooks/useTransmissionPreferences';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.85;

type Tab = 'voice' | 'text';

interface NewTransmissionSheetProps {
  visible: boolean;
  patientId: string | null;
  patientName?: string;
  onClose: () => void;
  onSaved?: (transmissionId: string) => void;
}

export function NewTransmissionSheet({
  visible,
  patientId,
  patientName,
  onClose,
  onSaved,
}: NewTransmissionSheetProps): React.JSX.Element {
  const { disableVoice } = useTransmissionPreferences();

  const [activeTab, setActiveTab] = useState<Tab>('voice');
  const effectiveTab: Tab = disableVoice ? 'text' : activeTab;

  const {
    status,
    transcribedText,
    elapsedSeconds,
    error,
    startRecording,
    stopRecording,
    reset: resetVoice,
  } = useVoiceTransmission();

  const [editedText, setEditedText] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'done' && transcribedText !== null && editedText === '') {
      setEditedText(transcribedText);
    }
  }, [status, transcribedText]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    await stopRecording(true);
    showSnack('Enregistrement annulé');
  };

  const handleClose = () => {
    resetVoice();
    setEditedText('');
    onClose();
  };

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  const handleSaveVoice = async () => {
    if (!editedText.trim()) return;
    setSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const fakeId = `tx-voice-${Date.now()}`;
      showSnack('Transmission enregistrée ✓');
      onSaved?.(fakeId);
      setTimeout(() => { setSaving(false); handleClose(); }, 800);
    } catch {
      setSaving(false);
      showSnack('Erreur — réessayez');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Overlay plein écran — tap en dehors ferme */}
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        {/* KeyboardAvoidingView ne doit PAS avoir flex:1 ici */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        >
          {/* Sheet à hauteur FIXE — c'est la clé */}
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Nouvelle transmission</Text>
                {patientName !== undefined && (
                  <Text style={styles.headerPatient}>{patientName}</Text>
                )}
              </View>
              <Button
                mode="text"
                compact
                onPress={handleClose}
                textColor={COLORS.textMuted}
              >
                Fermer
              </Button>
            </View>

            {/* Onglets — masqués si FR48 */}
            {!disableVoice && (
              <View style={styles.tabBar}>
                {(['voice', 'text'] as Tab[]).map((tab) => (
                  <Pressable
                    key={tab}
                    style={[styles.tab, effectiveTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: effectiveTab === tab }}
                  >
                    <MaterialCommunityIcons
                      name={tab === 'voice' ? 'microphone' : 'text-box-edit-outline'}
                      size={16}
                      color={effectiveTab === tab ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.tabLabel, effectiveTab === tab && styles.tabLabelActive]}>
                      {tab === 'voice' ? 'Dicter' : 'Texte'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ScrollView prend tout l'espace restant grâce au sheet à hauteur fixe */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {effectiveTab === 'voice' && (
                <>
                  {error !== null && (
                    <View style={styles.errorBanner}>
                      <MaterialCommunityIcons name="microphone-off" size={18} color={COLORS.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {status !== 'done' && error === null && (
                    <View style={styles.recorderWrap}>
                      <VoiceRecorderButton
                        status={status}
                        elapsedSeconds={elapsedSeconds}
                        onStart={() => { void startRecording(); }}
                        onStop={() => { void stopRecording(false); }}
                        onCancel={() => { void handleCancel(); }}
                      />
                    </View>
                  )}

                  {status === 'done' && transcribedText !== null && (
                    <>
                      <TranscriptionViewer text={editedText} onTextChange={setEditedText} />
                      <View style={styles.actionRow}>
                        <Button
                          mode="outlined"
                          onPress={resetVoice}
                          style={styles.rerecordBtn}
                          textColor={COLORS.primary}
                          icon="microphone-outline"
                        >
                          Recommencer
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => { void handleSaveVoice(); }}
                          loading={saving}
                          disabled={saving || !editedText.trim()}
                          buttonColor={COLORS.teal}
                          icon="check-circle"
                          style={styles.saveBtn}
                        >
                          Valider
                        </Button>
                      </View>
                    </>
                  )}
                </>
              )}

              {effectiveTab === 'text' && (
                <TextTransmissionForm
                  patientId={patientId}
                  onSaved={(id) => {
                    showSnack('Transmission enregistrée ✓');
                    onSaved?.(id);
                    setTimeout(handleClose, 1000);
                  }}
                />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={3000}
          style={styles.snack}
        >
          {snackMsg}
        </Snackbar>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Hauteur fixe = la clé d'un bottom sheet fiable
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    overflow: 'hidden',
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerPatient: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.primary },

  // flex:1 fonctionne car le parent (sheet) a une hauteur fixe
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: COLORS.error, flex: 1 },

  recorderWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rerecordBtn: { flex: 1, borderColor: COLORS.primary },
  saveBtn: { flex: 2 },

  snack: { marginBottom: Platform.OS === 'ios' ? 36 : 16 },
});
