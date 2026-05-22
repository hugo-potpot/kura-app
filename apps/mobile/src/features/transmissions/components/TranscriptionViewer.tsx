import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/theme/kura-theme';

interface TranscriptionViewerProps {
  text: string;
  onTextChange: (t: string) => void;
}

export function TranscriptionViewer({
  text,
  onTextChange,
}: TranscriptionViewerProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Bandeau IA */}
      <View style={styles.aiBanner}>
        <MaterialCommunityIcons name="robot-outline" size={16} color={COLORS.primary} />
        <Text style={styles.aiBannerText} maxFontSizeMultiplier={1.2}>
          Transcription IA — relisez et corrigez si besoin
        </Text>
      </View>

      {/* Zone de texte éditable */}
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={onTextChange}
        multiline
        textAlignVertical="top"
        placeholder="La transcription apparaîtra ici…"
        placeholderTextColor={COLORS.textMuted}
        accessibilityLabel="Texte transcrit — modifiable"
      />

      {/* Note conformité HDS */}
      <View style={styles.complianceNote}>
        <MaterialCommunityIcons name="shield-check-outline" size={14} color={COLORS.teal} />
        <Text style={styles.complianceText} maxFontSizeMultiplier={1.1}>
          Transcription locale (0 cloud) · Validation obligatoire avant enregistrement
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  aiBannerText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 120,
    lineHeight: 22,
  },
  complianceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  complianceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
});
