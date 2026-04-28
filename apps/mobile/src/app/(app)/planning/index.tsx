import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { CircularProgressRing } from '@/features/planning/components/CircularProgressRing';
import { MapToggleSection } from '@/features/planning/components/MapToggleSection';
import { PlanningCard } from '@/features/planning/components/PlanningCard';
import {
  formatEtaSegmentLabel,
  formatVisitClockLabel,
  patientDisplayName,
  usePlanning,
} from '@/features/planning/hooks/usePlanning';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { COLORS } from '@/theme/kura-theme';
import { DEFAULT_CARE_TYPE_LABEL } from '@/features/planning/utils/planning-utils';

function PlanningCardSkeleton(): React.JSX.Element {
  return (
    <View style={styles.skelCard}>
      <View style={styles.skelLineShort} />
      <View style={styles.skelLineLong} />
    </View>
  );
}

export default function PlanningScreen(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'IDEL';
  const {
    visits,
    sortedEtaSlices,
    completedVisits,
    totalVisits,
    totalEtaMinutes,
    hasPendingSync,
    isLoading,
    showSkeleton,
    headerDateLabel,
    pins,
  } = usePlanning();

  const syncVariant = hasPendingSync ? 'pending' : 'synced';

  return (
    <View style={styles.root}>
      <View style={[styles.header, { backgroundColor: COLORS.teal }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerGreeting} maxFontSizeMultiplier={1.5}>
                Bonjour, {firstName} 👋
              </Text>
              <Text style={styles.headerDate} maxFontSizeMultiplier={1.5}>
                {headerDateLabel}
              </Text>
            </View>
            <CircularProgressRing
              completed={completedVisits}
              total={totalVisits}
              accessibilityLabel={`Progression ${completedVisits} visites terminées sur ${totalVisits}`}
            />
          </View>

          <View style={styles.headerBottom}>
            <View style={styles.statBadge}>
              <MaterialCommunityIcons name="timer-sand" size={14} color="#fff" />
              <Text style={styles.statText} maxFontSizeMultiplier={1.5}>
                ETA total ~{totalEtaMinutes} min
              </Text>
            </View>
            <SyncStatusIndicator variant={syncVariant} />
          </View>
        </SafeAreaView>
      </View>

      <MapToggleSection pins={pins} />

      <View style={styles.filterRow}>
        <Chip selected style={styles.filterChip} compact>
          {"Aujourd'hui"}
        </Chip>
        <Chip style={styles.filterChip} compact disabled>
          Cette semaine
        </Chip>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !showSkeleton && (
          <View style={styles.centerPad}>
            <ActivityIndicator color={COLORS.teal} accessibilityLabel="Chargement du planning" />
          </View>
        )}

        {showSkeleton && (
          <>
            <PlanningCardSkeleton />
            <PlanningCardSkeleton />
            <PlanningCardSkeleton />
          </>
        )}

        {!isLoading && visits.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.5}>
              {"Aucun patient planifié aujourd'hui"}
            </Text>
            <Link href="/patients" asChild>
              <Pressable
                style={styles.cta}
                accessibilityRole="link"
                accessibilityLabel="Voir mes patients"
              >
                <MaterialCommunityIcons name="account-group-outline" size={20} color="#fff" />
                <Text style={styles.ctaText} maxFontSizeMultiplier={1.5}>
                  Voir mes patients
                </Text>
              </Pressable>
            </Link>
          </View>
        )}

        {!isLoading &&
          visits.map((v) => (
            <PlanningCard
              key={v.entryId}
              patientDisplayName={patientDisplayName(v)}
              addressShort={v.addressShort}
              estimatedClockLabel={formatVisitClockLabel(v, sortedEtaSlices)}
              careTypeLabel={DEFAULT_CARE_TYPE_LABEL}
              etaMinutesLabel={formatEtaSegmentLabel(v.etaMinutes)}
              status={v.status}
              orderIndex={v.orderIndex}
            />
          ))}

        <View style={{ height: 96 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: { flex: 1 },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 44,
  },
  statText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: { borderRadius: 20 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  centerPad: { paddingVertical: 24, alignItems: 'center' },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    minHeight: 48,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  skelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    opacity: 0.85,
  },
  skelLineShort: {
    height: 12,
    width: '35%',
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  skelLineLong: {
    height: 10,
    width: '85%',
    borderRadius: 6,
    backgroundColor: '#EEF2F6',
  },
});
