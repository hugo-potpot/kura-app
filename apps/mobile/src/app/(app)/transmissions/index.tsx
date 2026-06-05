import { FlatList, View, StyleSheet, Platform } from 'react-native';
import { Text, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

import { NewTransmissionSheet } from '@/features/transmissions/components/NewTransmissionSheet';
import {
  useTransmissions,
  type TransmissionFilter,
  type TransmissionRow,
} from '@/features/transmissions/hooks/useTransmissions';
import { CARE_TYPE_LABELS } from '@/features/transmissions/services/care-type-templates';
import { COLORS } from '@/theme/kura-theme';
import { getIsOnline } from '@/lib/useNetworkStatus';

function formatDate(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Aujourd'hui";
  if (isYesterday) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const CARE_TYPE_ICON: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  toilette: 'shower-head',
  pansement: 'bandage',
  injection: 'needle',
  constantes: 'heart-pulse',
  autre: 'note-text-outline',
};
const CARE_TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  toilette:   { color: COLORS.primary, bg: '#EEF2FF' },
  pansement:  { color: '#7C3AED', bg: '#F5F3FF' },
  injection:  { color: COLORS.error, bg: '#FEF2F2' },
  constantes: { color: '#DC2626', bg: '#FEF2F2' },
  autre:      { color: COLORS.textSecondary, bg: '#F8FAFC' },
};

function TransmissionCard({ item }: { item: TransmissionRow }) {
  const cfg = CARE_TYPE_COLOR[item.careType] ?? CARE_TYPE_COLOR['autre']!;
  const icon = CARE_TYPE_ICON[item.careType] ?? 'note-text-outline';
  const isSynced = item.syncedAt !== null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardPatient}>{item.patientName}</Text>
          <Text style={styles.cardTime}>
            {formatDate(item.createdAt)} · {formatTime(item.createdAt)} · {CARE_TYPE_LABELS[item.careType] ?? item.careType}
          </Text>
        </View>
        <View style={[styles.syncBadge, isSynced ? styles.syncBadgeSynced : styles.syncBadgePending]}>
          <MaterialCommunityIcons
            name={isSynced ? 'cloud-check' : 'cloud-sync-outline'}
            size={13}
            color={isSynced ? COLORS.teal : COLORS.warningText}
          />
          <Text style={[styles.syncText, isSynced ? styles.syncTextSynced : styles.syncTextPending]}>
            {isSynced ? 'Sync.' : 'En attente'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>{item.contentValidated}</Text>
    </View>
  );
}

export default function TransmissionsScreen(): React.JSX.Element {
  const [filter, setFilter] = useState<TransmissionFilter>('today');
  const [isOnline, setIsOnline] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  const { data: transmissions = [], isLoading } = useTransmissions(null, filter);

  useEffect(() => {
    void getIsOnline().then(setIsOnline);
  }, []);

  const pendingCount = transmissions.filter((t) => t.syncedAt === null).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { backgroundColor: COLORS.primaryDark }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Transmissions</Text>
            <Text style={styles.headerSub}>Historique & Synchronisation</Text>
          </View>
        </SafeAreaView>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={COLORS.warningText} />
          <Text style={styles.offlineText}>
            Mode hors ligne — {pendingCount} transmission{pendingCount > 1 ? 's' : ''} en attente de sync.
          </Text>
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={16} color={COLORS.primary} />
          <Text style={styles.pendingText}>
            {pendingCount} transmission{pendingCount > 1 ? 's' : ''} en attente de synchronisation
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['today', 'week', 'all'] as TransmissionFilter[]).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.filterChip}
            compact
          >
            {f === 'today' ? "Aujourd'hui" : f === 'week' ? 'Cette semaine' : 'Toutes'}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={transmissions}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TransmissionCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucune transmission</Text>
              <Text style={styles.emptySub}>
                {filter === 'today' ? "Aucune transmission aujourd'hui." : filter === 'week' ? 'Aucune cette semaine.' : 'Aucune transmission enregistrée.'}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="microphone-plus"
        style={styles.fab}
        color="#fff"
        onPress={() => setSheetVisible(true)}
        accessibilityLabel="Ajouter une transmission"
      />

      <NewTransmissionSheet
        visible={sheetVisible}
        patientId={null}
        onClose={() => setSheetVisible(false)}
        onSaved={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.warningBorder, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.warningBorder,
  },
  offlineText: { fontSize: 13, color: COLORS.warningText, fontWeight: '500', flex: 1 },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#C7D2FE',
  },
  pendingText: { fontSize: 13, color: COLORS.primary, fontWeight: '500', flex: 1 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { borderRadius: 20 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardPatient: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  syncBadgeSynced: { backgroundColor: '#ECFDF5' },
  syncBadgePending: { backgroundColor: COLORS.warning },
  syncText: { fontSize: 11, fontWeight: '600' },
  syncTextSynced: { color: COLORS.teal },
  syncTextPending: { color: COLORS.warningText },
  cardContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: COLORS.primary, borderRadius: 28 },
});
