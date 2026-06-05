import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/theme/kura-theme';

import { minutesToClockLabel } from '../utils/planning-utils';

interface LunchBreakBannerProps {
  readonly startMinutes: number;
  readonly durationMinutes: number;
}

/** Encart intercalaire « Pause déjeuner » affiché entre deux visites du planning. */
export function LunchBreakBanner({
  startMinutes,
  durationMinutes,
}: LunchBreakBannerProps): React.JSX.Element {
  const start = minutesToClockLabel(startMinutes);
  const end = minutesToClockLabel(startMinutes + durationMinutes);

  return (
    <View style={styles.container} accessibilityRole="text" accessibilityLabel={`Pause déjeuner de ${start} à ${end}`}>
      <View style={styles.line} />
      <View style={styles.pill}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={COLORS.warningText} />
        <Text style={styles.label}>Pause déjeuner</Text>
        <Text style={styles.time}>{`${start} – ${end}`}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.warningBorder,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warning,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.warningBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warningText,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warningText,
    opacity: 0.85,
  },
});
