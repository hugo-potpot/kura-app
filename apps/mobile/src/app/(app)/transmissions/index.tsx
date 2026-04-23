import { FlatList, View, StyleSheet, Platform } from 'react-native';
import { Text, Chip, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

import { COLORS } from '@/theme/kura-theme';
import { getIsOnline } from '@/lib/useNetworkStatus';

type FilterType = 'today' | 'week' | 'all';

interface Transmission {
  id: string;
  patientName: string;
  content: string;
  date: string;
  time: string;
  synced: boolean;
  type: 'note' | 'constante' | 'alerte';
}

const MOCK_TRANSMISSIONS: Transmission[] = [
  {
    id: '1',
    patientName: 'Marie Dupont',
    content: 'Pansement changé. Plaie propre, cicatrisation en bonne voie. Pas de signe infectieux.',
    date: "Aujourd'hui",
    time: '09:14',
    synced: true,
    type: 'note',
  },
  {
    id: '2',
    patientName: 'Jean Martin',
    content: 'TA : 145/90 mmHg. Pouls : 78 bpm. Patient essoufflé à l\'effort. Médecin prévenu.',
    date: "Aujourd'hui",
    time: '08:30',
    synced: false,
    type: 'constante',
  },
  {
    id: '3',
    patientName: 'Hélène Bernard',
    content: 'Injection Lovenox 0.4ml SC réalisée sans incident. Patient bien tolérant.',
    date: 'Hier',
    time: '17:45',
    synced: true,
    type: 'note',
  },
];

const TYPE_CONFIG: Record<string, { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; bg: string }> = {
  note: { icon: 'note-text-outline', color: COLORS.primary, bg: '#EEF2FF' },
  constante: { icon: 'heart-pulse', color: COLORS.error, bg: '#FEF2F2' },
  alerte: { icon: 'alert-circle-outline', color: COLORS.warningText, bg: COLORS.warning },
};

function TransmissionCard({ item }: { item: Transmission }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG['note']!;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardPatient}>{item.patientName}</Text>
          <Text style={styles.cardTime}>{item.date} · {item.time}</Text>
        </View>
        <View style={[styles.syncBadge, item.synced ? styles.syncBadgeSynced : styles.syncBadgePending]}>
          <MaterialCommunityIcons
            name={item.synced ? 'cloud-check' : 'cloud-sync-outline'}
            size={13}
            color={item.synced ? COLORS.teal : COLORS.warningText}
          />
          <Text style={[styles.syncText, item.synced ? styles.syncTextSynced : styles.syncTextPending]}>
            {item.synced ? 'Sync.' : 'En attente'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
    </View>
  );
}

export default function TransmissionsScreen(): React.JSX.Element {
  const [filter, setFilter] = useState<FilterType>('today');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    void getIsOnline().then(setIsOnline);
  }, []);

  const pendingCount = MOCK_TRANSMISSIONS.filter((t) => !t.synced).length;

  return (
    <View style={styles.root}>
      {/* Header indigo */}
      <View style={[styles.header, { backgroundColor: COLORS.primaryDark }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Transmissions</Text>
            <Text style={styles.headerSub}>Historique & Synchronisation</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={COLORS.warningText} />
          <Text style={styles.offlineText}>
            Mode hors ligne — {pendingCount} transmission{pendingCount > 1 ? 's' : ''} en attente de sync.
          </Text>
        </View>
      )}

      {/* Pending sync banner (online but pending) */}
      {isOnline && pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={16} color={COLORS.primary} />
          <Text style={styles.pendingText}>
            {pendingCount} transmission{pendingCount > 1 ? 's' : ''} en attente de synchronisation
          </Text>
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <Chip
          selected={filter === 'today'}
          onPress={() => setFilter('today')}
          style={styles.filterChip}
          compact
        >
          Aujourd'hui
        </Chip>
        <Chip
          selected={filter === 'week'}
          onPress={() => setFilter('week')}
          style={styles.filterChip}
          compact
        >
          Cette semaine
        </Chip>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
          compact
        >
          Toutes
        </Chip>
      </View>

      <FlatList
        data={MOCK_TRANSMISSIONS}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransmissionCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucune transmission</Text>
            <Text style={styles.emptySub}>Les transmissions apparaîtront ici.</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => {}}
        accessibilityLabel="Ajouter une transmission"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 12 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.warningBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warningBorder,
  },
  offlineText: {
    fontSize: 13,
    color: COLORS.warningText,
    fontWeight: '500',
    flex: 1,
  },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  pendingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: { borderRadius: 20 },

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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { flex: 1 },
  cardPatient: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncBadgeSynced: { backgroundColor: '#ECFDF5' },
  syncBadgePending: { backgroundColor: COLORS.warning },
  syncText: { fontSize: 11, fontWeight: '600' },
  syncTextSynced: { color: COLORS.teal },
  syncTextPending: { color: COLORS.warningText },
  cardContent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
  },
});
