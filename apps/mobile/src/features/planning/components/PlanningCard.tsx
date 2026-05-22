import { View, StyleSheet, Platform, Pressable, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef } from 'react';

import { COLORS } from '@/theme/kura-theme';

import type { PlanningEntryStatus } from '../utils/planning-utils';

const STATUS_STYLE: Record<
  PlanningEntryStatus,
  { opacity: number }
> = {
  pending: { opacity: 1 },
  in_progress: { opacity: 1 },
  done: { opacity: 0.72 },
  skipped: { opacity: 1 },
};

function badgePaletteForStatus(status: PlanningEntryStatus): { bg: string; text: string } {
  if (status === 'done') return { bg: '#E8F5E9', text: '#2E7D32' };
  if (status === 'skipped') return { bg: '#FFE0B2', text: '#E65100' };
  return { bg: '#E6F6FF', text: COLORS.primary };
}

interface PlanningCardProps {
  readonly patientDisplayName: string;
  readonly addressShort: string;
  readonly addressForNavigation: string;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly estimatedClockLabel: string;
  readonly careTypeLabel: string;
  readonly etaMinutesLabel: string | null;
  readonly status: PlanningEntryStatus;
  readonly orderIndex: number;
  readonly placementExplanation?: string | null;
  readonly addressGeocoded?: boolean;
  readonly drag?: () => void;
  readonly dragActive?: boolean;
  readonly swipeEnabled?: boolean;
  readonly onSwipeAbsent?: () => void;
  readonly onSwipeComplete?: () => void;
  readonly onSwipeNavigate?: (address: string, lat?: number | null, lng?: number | null) => void;
}

export function PlanningCard({
  patientDisplayName,
  addressShort,
  addressForNavigation,
  latitude = null,
  longitude = null,
  estimatedClockLabel,
  careTypeLabel,
  etaMinutesLabel,
  status,
  orderIndex,
  placementExplanation = null,
  addressGeocoded = true,
  drag,
  dragActive = false,
  swipeEnabled = true,
  onSwipeAbsent,
  onSwipeComplete,
  onSwipeNavigate,
}: PlanningCardProps): React.JSX.Element {
  const swipeRef = useRef<Swipeable>(null);
  const st = STATUS_STYLE[status];
  const badgePalette = badgePaletteForStatus(status);
  const isAbsent = status === 'skipped';

  const etaPart = etaMinutesLabel === null ? '' : `, ${etaMinutesLabel}`;
  const geoPart = addressGeocoded ? '' : ', adresse sans coordonnées GPS';
  const placePart =
    placementExplanation !== null && placementExplanation.length > 0 ? `, ${placementExplanation}` : '';
  const accessibilityLabel = `Visite ${orderIndex + 1}, ${patientDisplayName}, ${estimatedClockLabel}, ${careTypeLabel}${etaPart}${geoPart}${placePart}`;

  const closeSwipe = (): void => {
    swipeRef.current?.close();
  };

  const openNavigate = (): void => {
    const addr = addressForNavigation.trim();
    if (addr.length === 0 && latitude == null) return;
    onSwipeNavigate?.(addr, latitude, longitude);
    closeSwipe();
  };

  const requestAbsent = (): void => {
    onSwipeAbsent?.();
    closeSwipe();
  };

  const requestComplete = (): void => {
    onSwipeComplete?.();
    closeSwipe();
  };

  const canComplete = onSwipeComplete !== undefined && (status === 'pending' || status === 'in_progress');

  const renderLeftActions = canComplete
    ? (): React.JSX.Element => (
        <View style={styles.swipeActionsLeft} accessibilityRole="toolbar">
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeTerminer]}
            onPress={requestComplete}
            accessibilityRole="button"
            accessibilityLabel="Marquer le soin comme terminé"
          >
            <Text style={styles.swipeBtnText} maxFontSizeMultiplier={1.5}>
              Terminer
            </Text>
          </TouchableOpacity>
        </View>
      )
    : undefined;

  const renderRightActions = (): React.JSX.Element => (
    <View style={styles.swipeActions} accessibilityRole="toolbar">
      <TouchableOpacity
        style={[styles.swipeBtn, styles.swipeAbsent]}
        onPress={requestAbsent}
        accessibilityRole="button"
        accessibilityLabel="Marquer absent"
      >
        <Text style={styles.swipeBtnText} maxFontSizeMultiplier={1.5}>
          Absent
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.swipeDeplacer]}
        disabled
        accessibilityRole="button"
        accessibilityLabel="Déplacer, indisponible"
        accessibilityState={{ disabled: true }}
      >
        <Text style={[styles.swipeBtnText, styles.swipeBtnTextMuted]} maxFontSizeMultiplier={1.5}>
          Déplacer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.swipeNaviguer]}
        onPress={openNavigate}
        accessibilityRole="button"
        accessibilityLabel="Naviguer vers le patient"
      >
        <Text style={[styles.swipeBtnText, styles.swipeBtnTextLight]} maxFontSizeMultiplier={1.5}>
          Naviguer
        </Text>
      </TouchableOpacity>
    </View>
  );

  const rowInner = (
    <>
      {drag !== undefined && (
        <View style={styles.dragHandle} accessibilityElementsHidden>
          <MaterialCommunityIcons name="drag-vertical" size={18} color={COLORS.textMuted} />
        </View>
      )}
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
              {isAbsent ? 'Absent' : careTypeLabel}
            </Text>
          </View>
        </View>
        <View style={styles.addrRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={12}
            color={status === 'done' ? COLORS.textMuted : COLORS.textSecondary}
          />
          <Text style={[styles.addr, status === 'done' && styles.muted]} numberOfLines={1} maxFontSizeMultiplier={1.5}>
            {addressShort}
          </Text>
          {!addressGeocoded && (
            <Text style={styles.fallbackBadge} maxFontSizeMultiplier={1.5}>
              Adresse non géolocalisée
            </Text>
          )}
        </View>
        {placementExplanation !== null && placementExplanation.length > 0 && (
          <View style={styles.explainRow}>
            <MaterialCommunityIcons name="lightbulb-outline" size={13} color={COLORS.teal} />
            <Text style={styles.explainText} maxFontSizeMultiplier={1.5}>
              {placementExplanation}
            </Text>
          </View>
        )}
        {etaMinutesLabel !== null && (
          <View style={styles.etaRow}>
            <MaterialCommunityIcons name="walk" size={12} color={COLORS.textMuted} />
            <Text style={styles.etaText} maxFontSizeMultiplier={1.5}>
              {etaMinutesLabel}
            </Text>
          </View>
        )}
      </View>
      {onSwipeNavigate !== undefined && addressForNavigation.trim().length > 0 && (
        <Pressable
          onPress={openNavigate}
          style={({ pressed }) => [styles.inlineNavBtn, pressed && styles.inlineNavBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Naviguer vers le patient"
        >
          <MaterialCommunityIcons name="navigation-variant" size={22} color={COLORS.primary} />
        </Pressable>
      )}
      {(status === 'done' || status === 'in_progress') && (
        <MaterialCommunityIcons
          name={status === 'done' ? 'check-circle' : 'progress-clock'}
          size={22}
          color={status === 'done' ? COLORS.teal : COLORS.tealAccent}
          style={styles.trailingIcon}
        />
      )}
    </>
  );

  const cardShell = (inner: React.ReactNode): React.JSX.Element => (
    <View
      style={[
        styles.card,
        { opacity: st.opacity },
        isAbsent && styles.cardAbsent,
        dragActive && styles.cardDragging,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      {inner}
    </View>
  );

  const body =
    drag === undefined ? (
      cardShell(rowInner)
    ) : (
      <Pressable
        delayLongPress={300}
        onLongPress={() => {
          drag();
        }}
        accessibilityRole="summary"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Maintenir pour réorganiser la tournée"
      >
        {cardShell(rowInner)}
      </Pressable>
    );

  const canSwipe = swipeEnabled && (onSwipeAbsent !== undefined || canComplete);

  if (!canSwipe) {
    return body;
  }

  return (
    <Swipeable
      ref={swipeRef}
      enabled={swipeEnabled}
      friction={2}
      renderRightActions={onSwipeAbsent !== undefined ? renderRightActions : undefined}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      {body}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 52,
  },
  swipeActionsLeft: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 52,
  },
  swipeTerminer: {
    backgroundColor: '#2E7D32',
    minWidth: 90,
  },
  swipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 76,
  },
  swipeAbsent: {
    backgroundColor: '#FB8C00',
  },
  swipeDeplacer: {
    backgroundColor: '#B0BEC5',
  },
  swipeNaviguer: {
    backgroundColor: '#3949AB',
  },
  swipeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  swipeBtnTextMuted: {
    color: 'rgba(255,255,255,0.65)',
  },
  swipeBtnTextLight: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    gap: 10,
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
  cardAbsent: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  cardDragging: {
    transform: [{ rotate: '2deg' }],
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  dragHandle: {
    minWidth: 40,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexWrap: 'wrap',
  },
  fallbackBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tealAccent,
    backgroundColor: '#E8F8F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  explainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  explainText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  inlineNavBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  inlineNavBtnPressed: {
    opacity: 0.8,
  },
});
