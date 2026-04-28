import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/theme/kura-theme';

import type { PlanningEntryStatus } from '../utils/planning-utils';

const STATUS_STYLE: Record<
  PlanningEntryStatus,
  { opacity: number }
> = {
  pending: { opacity: 1 },
  in_progress: { opacity: 1 },
  done: { opacity: 0.72 },
  skipped: { opacity: 0.65 },
};

function badgePaletteForStatus(status: PlanningEntryStatus): { bg: string; text: string } {
  if (status === 'done') return { bg: '#E8F5E9', text: '#2E7D32' };
  if (status === 'skipped') return { bg: '#F5F5F5', text: '#64748B' };
  return { bg: '#E6F6FF', text: COLORS.primary };
}

interface PlanningCardProps {
  readonly patientDisplayName: string;
  readonly addressShort: string;
  readonly estimatedClockLabel: string;
  readonly careTypeLabel: string;
  readonly etaMinutesLabel: string | null;
  readonly status: PlanningEntryStatus;
  readonly orderIndex: number;
}

export function PlanningCard({
  patientDisplayName,
  addressShort,
  estimatedClockLabel,
  careTypeLabel,
  etaMinutesLabel,
  status,
  orderIndex,
}: PlanningCardProps): React.JSX.Element {
  const st = STATUS_STYLE[status];
  const badgePalette = badgePaletteForStatus(status);

  const etaPart = etaMinutesLabel === null ? '' : `, ${etaMinutesLabel}`;
  const accessibilityLabel = `Visite ${orderIndex + 1}, ${patientDisplayName}, ${estimatedClockLabel}, ${careTypeLabel}${etaPart}`;

  return (
    <View
      style={[styles.card, { opacity: st.opacity }]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.timeCol}>
        <Text style={[styles.timeText, status === 'done' && styles.muted]} maxFontSizeMultiplier={1.5}>
          {estimatedClockLabel}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.main}>
        <View style={styles.row}>
          <Text style={[styles.name, status === 'done' && styles.muted]} numberOfLines={1} maxFontSizeMultiplier={1.5}>
            {patientDisplayName}
          </Text>
          <View style={[styles.badge, { backgroundColor: badgePalette.bg }]}>
            <Text style={[styles.badgeText, { color: badgePalette.text }]} maxFontSizeMultiplier={1.5}>
              {careTypeLabel}
            </Text>
          </View>
        </View>
        <View style={styles.addrRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={12}
            color={status === 'done' ? COLORS.textMuted : COLORS.textSecondary}
          />
          <Text
            style={[styles.addr, status === 'done' && styles.muted]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}
          >
            {addressShort}
          </Text>
        </View>
        {etaMinutesLabel !== null && (
          <View style={styles.etaRow}>
            <MaterialCommunityIcons name="walk" size={12} color={COLORS.textMuted} />
            <Text style={styles.etaText} maxFontSizeMultiplier={1.5}>
              {etaMinutesLabel}
            </Text>
          </View>
        )}
      </View>
      {(status === 'done' || status === 'in_progress') && (
        <MaterialCommunityIcons
          name={status === 'done' ? 'check-circle' : 'progress-clock'}
          size={22}
          color={status === 'done' ? COLORS.teal : COLORS.tealAccent}
          style={styles.trailingIcon}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  timeCol: { minWidth: 44, alignItems: 'center' },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  muted: { color: COLORS.textMuted },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: '#E2E8F0',
  },
  main: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addr: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  etaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  trailingIcon: { marginLeft: 4 },
});
