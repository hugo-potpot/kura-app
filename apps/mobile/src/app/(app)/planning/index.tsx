import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { FlatList } from 'react-native-gesture-handler';
import {
  Text,
  Chip,
  Snackbar,
  FAB,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';

import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { resetLocalDb } from '@/features/planning/lib/resetLocalPlanning';
import { getDb } from '@/lib/db';
import { CircularProgressRing } from '@/features/planning/components/CircularProgressRing';
import { MapToggleSection } from '@/features/planning/components/MapToggleSection';
import { UrgencyBottomSheet } from '@/features/planning/components/UrgencyBottomSheet';
import { PlanningCard } from '@/features/planning/components/PlanningCard';
import { useAbsentPatient } from '@/features/planning/hooks/useAbsentPatient';
import { useAddUrgency } from '@/features/planning/hooks/useAddUrgency';
import { useOptimizePlanning } from '@/features/planning/hooks/useOptimizePlanning';
import { usePlanningPreferences } from '@/features/planning/hooks/usePlanningPreferences';
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
import {
  DEFAULT_CARE_TYPE_LABEL,
  openNativeMapsNavigation,
} from '@/features/planning/utils/planning-utils';

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
    preferences,
    preferencesReady: manualPreferencesReady,
  } = usePlanningPreferences();
  const manualModePur = preferences.manualModePur;
  const dayStartMinutes = preferences.dayStartMinutes;

  const {
    confirmAndMarkAbsent,
    absentSnackbarVisible,
    absentSnackbarMessage,
    onAbsentUndoPress,
    onAbsentSnackbarDismiss,
    absentInfoSnackbarVisible,
    absentInfoMessage,
    onAbsentInfoDismiss,
  } = useAbsentPatient(refetchPlanning);

  const {
    candidates: urgencyCandidates,
    loadCandidates: loadUrgencyCandidates,
    suggestUrgencyInsertion,
    addUrgency,
  } = useAddUrgency(refetchPlanning);

  const [confirmAbsentEntryId, setConfirmAbsentEntryId] = useState<string | null>(null);
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [urgencyFabOpen, setUrgencyFabOpen] = useState(false);

  const listRef = useRef<FlatList<PlanningVisitRow>>(null);

  const visitsRef = useRef(visits);
  visitsRef.current = visits;

  const absentDialogVisit = useMemo(
    () => visits.find((x) => x.entryId === confirmAbsentEntryId) ?? null,
    [visits, confirmAbsentEntryId],
  );

  const syncVariant = hasPendingSync ? 'pending' : 'synced';

  useFocusEffect(
    useCallback(() => {
      refetchPlanning();
    }, [refetchPlanning]),
  );

  // Déclenche l'optimisation automatique au premier focus du jour dès que le chargement
  // est terminé. Séparé de useFocusEffect pour éviter que isLoading/visits (qui changent
  // pendant le chargement) ne recréent le callback et re-déclenchent useFocusEffect en boucle.
  useEffect(() => {
    void tryFirstFocusOptimizeIfEligible({
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

  const nextNavigableVisit = useMemo(
    () =>
      visits.find(
        (v) =>
          (v.status === 'pending' || v.status === 'in_progress') &&
          v.addressFull.trim().length > 0,
      ),
    [visits],
  );

  const navigateToNextVisit = useCallback(() => {
    if (nextNavigableVisit !== undefined) {
      openNativeMapsNavigation(nextNavigableVisit.addressFull);
    }
  }, [nextNavigableVisit]);

  const onPlanningPinSelect = useCallback(
    (entryId: string) => {
      const idx = draggableRows.findIndex((v) => v.entryId === entryId);
      if (idx < 0) return;
      const flat = listRef.current;
      if (flat === null) return;
      requestAnimationFrame(() => {
        try {
          flat.scrollToIndex({ index: idx, animated: true, viewPosition: 0.35 });
          flat.flashScrollIndicators();
        } catch {
          flat.scrollToOffset({ offset: Math.max(0, idx * 140), animated: true });
        }
      });
    },
    [draggableRows],
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
          addressForNavigation={v.addressFull}
          estimatedClockLabel={formatVisitClockLabel(v, sortedEtaSlices, dayStartMinutes)}
          careTypeLabel={DEFAULT_CARE_TYPE_LABEL}
          etaMinutesLabel={formatEtaSegmentLabel(v.etaMinutes)}
          status={v.status}
          orderIndex={v.orderIndex}
          placementExplanation={explanationByEntryId.get(v.entryId) ?? null}
          addressGeocoded={v.latitude !== null && v.longitude !== null}
          drag={drag}
          dragActive={isActive}
          swipeEnabled={!isActive}
          onSwipeAbsent={() => {
            setConfirmAbsentEntryId(v.entryId);
          }}
          onSwipeNavigate={(addr) => {
            openNativeMapsNavigation(addr);
          }}
        />
      </ScaleDecorator>
    ),
    [dayStartMinutes, explanationByEntryId, sortedEtaSlices],
  );

  const listHeader = (
    <>
      <MapToggleSection
        pins={pins}
        onPinSelect={onPlanningPinSelect}
        onNavigateNext={navigateToNextVisit}
        canNavigateNext={nextNavigableVisit !== undefined}
      />

      <View style={styles.filterRow}>
        <Chip selected style={styles.filterChip} compact>
          {"Aujourd'hui"}
        </Chip>
        <Chip style={styles.filterChip} compact disabled>
          Cette semaine
        </Chip>
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
              {__DEV__ && (
                <Pressable
                  onPress={() => {
                    void (async () => {
                      const db = await getDb();
                      await resetLocalDb(db);
                      refetchPlanning();
                    })();
                  }}
                  style={{ marginLeft: 8, backgroundColor: 'rgba(255,0,0,0.25)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}
                  accessibilityLabel="Reset DB dev"
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>🗑️ Reset DB</Text>
                </Pressable>
              )}
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
          ref={listRef}
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
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({
              offset: Math.max(0, index * 140),
              animated: true,
            });
          }}
        />
      )}

      <Snackbar
        visible={snackbarVisible && !absentSnackbarVisible}
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

      <Snackbar
        visible={absentSnackbarVisible}
        duration={5000}
        onDismiss={onAbsentSnackbarDismiss}
        action={{
          label: 'Annuler',
          accessibilityLabel: 'Annuler le retrait du patient',
          onPress: () => {
            void onAbsentUndoPress();
          },
        }}
      >
        {absentSnackbarMessage}
      </Snackbar>

      <Snackbar visible={absentInfoSnackbarVisible} duration={3000} onDismiss={onAbsentInfoDismiss}>
        {absentInfoMessage}
      </Snackbar>

      <Portal>
        <Dialog
          visible={confirmAbsentEntryId !== null}
          onDismiss={() => {
            setConfirmAbsentEntryId(null);
          }}
        >
          <Dialog.Title maxFontSizeMultiplier={1.5}>
            {absentDialogVisit !== null
              ? `Retirer ${patientDisplayName(absentDialogVisit)} du planning ?`
              : 'Retirer du planning ?'}
          </Dialog.Title>
          <Dialog.Content>
            <Text maxFontSizeMultiplier={1.5}>
              Le patient sera marqué absent et les horaires de la tournée seront recalculés.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setConfirmAbsentEntryId(null);
              }}
            >
              Annuler
            </Button>
            <Button
              textColor="#C62828"
              onPress={() => {
                if (confirmAbsentEntryId !== null && absentDialogVisit !== null) {
                  void confirmAndMarkAbsent(confirmAbsentEntryId, absentDialogVisit.status);
                }
                setConfirmAbsentEntryId(null);
              }}
            >
              Retirer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <UrgencyBottomSheet
        visible={urgencyOpen}
        onDismiss={() => {
          setUrgencyOpen(false);
        }}
        candidates={urgencyCandidates}
        onLoadCandidates={loadUrgencyCandidates}
        visits={visits}
        suggestInsertion={suggestUrgencyInsertion}
        onConfirmUrgency={async (patientId, globalInsertIndex) => {
          await addUrgency(patientId, globalInsertIndex, visitsRef.current);
        }}
      />

      {!showSkeleton && (
        <FAB.Group
          open={urgencyFabOpen}
          visible
          icon={urgencyFabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'ambulance',
              label: 'Ajouter une urgence',
              onPress: (): void => {
                setUrgencyFabOpen(false);
                setUrgencyOpen(true);
              },
            },
          ]}
          onStateChange={({ open }): void => {
            setUrgencyFabOpen(open);
          }}
          style={styles.fabGroup}
          fabStyle={styles.fabFab}
          color="#fff"
        />
      )}
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
  fabGroup: {
    position: 'absolute',
    right: 20,
    bottom: 28,
  },
  fabFab: {
    borderRadius: 16,
    backgroundColor: '#00897B',
  },
});
