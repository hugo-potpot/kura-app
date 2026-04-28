import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Switch,
} from 'react-native';
import { useCallback } from 'react';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Text, Chip, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';

import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { CircularProgressRing } from '@/features/planning/components/CircularProgressRing';
import { MapToggleSection } from '@/features/planning/components/MapToggleSection';
import { PlanningCard } from '@/features/planning/components/PlanningCard';
import { useOptimizePlanning } from '@/features/planning/hooks/useOptimizePlanning';
import { usePlanningManualMode } from '@/features/planning/hooks/usePlanningManualMode';
import { useReorderPlanning } from '@/features/planning/hooks/useReorderPlanning';
import {
  formatEtaSegmentLabel,
  formatVisitClockLabel,
  patientDisplayName,
  usePlanning,
} from '@/features/planning/hooks/usePlanning';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import type { PlanningVisitRow } from '@/features/planning/model/types';
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
    refetchPlanning,
  } = usePlanning();

  const {
    draggableRows,
    onDragBegin,
    onDragEnd,
    snackbarVisible,
    snackbarActionLabel,
    onUndoSnackbarPress,
    onDismissSnackbar,
    infoSnackbarVisible,
    infoSnackbarMessage,
    onDismissInfoSnackbar,
  } = useReorderPlanning(visits, refetchPlanning);

  const {
    optimize,
    tryFirstFocusOptimizeIfEligible,
    isOptimizing,
    explanationByEntryId,
  } = useOptimizePlanning(refetchPlanning);

  const {
    manualModePur,
    setManualModePur,
    preferencesReady: manualPreferencesReady,
  } = usePlanningManualMode();

  const syncVariant = hasPendingSync ? 'pending' : 'synced';

  const runFirstFocus = useCallback(async (): Promise<void> => {
    await tryFirstFocusOptimizeIfEligible({
      visitsCount: visits.length,
      isLoading,
      manualModePur,
      manualPreferencesReady,
    });
  }, [
    visits.length,
    isLoading,
    manualModePur,
    manualPreferencesReady,
    tryFirstFocusOptimizeIfEligible,
  ]);

  useFocusEffect(
    useCallback(() => {
      void runFirstFocus();
    }, [runFirstFocus]),
  );

  const renderPlanningItem = useCallback(
    ({
      item: v,
      drag,
      isActive,
    }: {
      item: PlanningVisitRow;
      drag: () => void;
      isActive: boolean;
    }): React.ReactNode => (
      <ScaleDecorator activeScale={1.015}>
        <PlanningCard
          patientDisplayName={patientDisplayName(v)}
          addressShort={v.addressShort}
          estimatedClockLabel={formatVisitClockLabel(v, sortedEtaSlices)}
          careTypeLabel={DEFAULT_CARE_TYPE_LABEL}
          etaMinutesLabel={formatEtaSegmentLabel(v.etaMinutes)}
          status={v.status}
          orderIndex={v.orderIndex}
          placementExplanation={explanationByEntryId.get(v.entryId) ?? null}
          addressGeocoded={v.latitude !== null && v.longitude !== null}
          drag={drag}
          dragActive={isActive}
        />
      </ScaleDecorator>
    ),
    [explanationByEntryId, sortedEtaSlices],
  );

  const listHeader = (
    <>
      <MapToggleSection pins={pins} />

      <View style={styles.filterRow}>
        <Chip selected style={styles.filterChip} compact>
          {"Aujourd'hui"}
        </Chip>
        <Chip style={styles.filterChip} compact disabled>
          Cette semaine
        </Chip>
      </View>

      <View style={styles.manualModeRow}>
        <Text style={styles.manualLabel} maxFontSizeMultiplier={1.5}>
          Mode Manuel Pur
        </Text>
        <Switch
          value={manualModePur}
          accessibilityLabel={
            manualModePur
              ? 'Désactiver le mode organisation manuelle pure'
              : 'Activer le mode organisation manuelle pure sans optimisation automatique'
          }
          onValueChange={(v) => {
            void setManualModePur(v);
          }}
        />
      </View>

      {totalVisits > 0 && !manualModePur && (
        <View style={styles.optimizeRow}>
          <Pressable
            onPress={() => {
              void optimize();
            }}
            disabled={isOptimizing}
            style={({ pressed }) => [
              styles.optimizeBtn,
              pressed && !isOptimizing && styles.optimizeBtnPressed,
              isOptimizing && styles.optimizeBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isOptimizing
                ? 'Optimisation de la tournée en cours'
                : 'Optimiser la tournée minimiser les trajets'
            }
            accessibilityState={{ disabled: isOptimizing }}
          >
            {isOptimizing ? (
              <ActivityIndicator color="#fff" accessibilityLabel="Calcul en cours" />
            ) : (
              <MaterialCommunityIcons name="map-marker-path" size={20} color="#fff" />
            )}
            <Text style={styles.optimizeBtnText} maxFontSizeMultiplier={1.5}>
              {isOptimizing ? 'Optimisation…' : 'Optimiser la tournée'}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );

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

      {isLoading && !showSkeleton && (
        <View style={styles.centerPad}>
          <ActivityIndicator color={COLORS.teal} accessibilityLabel="Chargement du planning" />
        </View>
      )}

      {showSkeleton && (
        <View style={{ paddingHorizontal: 16, flex: 1 }}>
          <PlanningCardSkeleton />
          <PlanningCardSkeleton />
        </View>
      )}

      {!showSkeleton && visits.length === 0 && !isLoading && (
        <View style={[styles.scrollContent, styles.emptyOuter]}>
          {listHeader}
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
        </View>
      )}

      {!showSkeleton && visits.length > 0 && (
        <DraggableFlatList
          containerStyle={{ flex: 1 }}
          contentContainerStyle={styles.draggableScrollContent}
          data={draggableRows}
          keyExtractor={(v) => v.entryId}
          onDragBegin={() => {
            onDragBegin();
          }}
          onDragEnd={(p): void => {
            void onDragEnd({
              data: p.data as PlanningVisitRow[],
              from: p.from,
              to: p.to,
            });
          }}
          renderItem={renderPlanningItem}
          ListHeaderComponent={listHeader}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        duration={5000}
        onDismiss={() => {
          onDismissSnackbar();
        }}
        action={
          snackbarActionLabel !== null
            ? {
                label: snackbarActionLabel,
                accessibilityLabel: 'Annuler la modification récente',
                onPress: () => {
                  void onUndoSnackbarPress();
                },
              }
            : undefined
        }
      >
        Modification enregistrée
      </Snackbar>

      <Snackbar visible={infoSnackbarVisible} duration={3000} onDismiss={onDismissInfoSnackbar}>
        {infoSnackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingBottom: 16,
  },
  draggableScrollContent: { paddingHorizontal: 16, paddingBottom: 96 },
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
    marginHorizontal: -16,
  },
  manualModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 8,
    minHeight: 48,
    gap: 12,
    marginHorizontal: -16,
  },
  manualLabel: {
    flex: 1,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterChip: { borderRadius: 20 },
  optimizeRow: {
    paddingHorizontal: 16,
    marginBottom: 6,
    marginHorizontal: -16,
  },
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 22,
    minHeight: 48,
  },
  optimizeBtnPressed: {
    opacity: 0.9,
  },
  optimizeBtnDisabled: {
    opacity: 0.75,
  },
  optimizeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  scrollContent: { flex: 1 },
  emptyOuter: { justifyContent: 'flex-start', paddingHorizontal: 16 },
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
