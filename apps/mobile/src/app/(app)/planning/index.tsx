import { ScrollView, View, StyleSheet, Platform } from 'react-native';
import { Text, Chip, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/theme/kura-theme';
import { useAuthStore } from '@/features/auth/stores/auth-store';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatToday(): string {
  const now = new Date();
  return `${DAYS_FR[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;
}

const MOCK_VISITS = [
  {
    id: '1',
    patientName: 'Marie Dupont',
    time: '08:30',
    address: '12 rue des Lilas, Lyon',
    type: 'Pansement',
    done: false,
  },
  {
    id: '2',
    patientName: 'Jean Martin',
    time: '09:15',
    address: '4 allée des Roses, Lyon',
    type: 'Injection',
    done: false,
  },
  {
    id: '3',
    patientName: 'Hélène Bernard',
    time: '10:00',
    address: '8 cours Gambetta, Lyon',
    type: 'Bilan',
    done: true,
  },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Pansement: { bg: '#E8F5E9', text: '#2E7D32' },
  Injection: { bg: '#E3F2FD', text: '#1565C0' },
  Bilan: { bg: '#FFF3E0', text: '#E65100' },
};

function VisitCard({
  patientName,
  time,
  address,
  type,
  done,
}: {
  patientName: string;
  time: string;
  address: string;
  type: string;
  done: boolean;
}) {
  const badge = TYPE_COLORS[type] ?? { bg: '#F3E5F5', text: '#6A1B9A' };
  return (
    <View style={[styles.visitCard, done && styles.visitCardDone]}>
      <View style={styles.visitTime}>
        <Text style={[styles.visitTimeText, done && styles.visitTimeDone]}>{time}</Text>
      </View>
      <View style={styles.visitDivider} />
      <View style={styles.visitInfo}>
        <View style={styles.visitRow}>
          <Text style={[styles.visitName, done && styles.visitNameDone]} numberOfLines={1}>
            {patientName}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.typeBadgeText, { color: badge.text }]}>{type}</Text>
          </View>
        </View>
        <View style={styles.visitAddressRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={12}
            color={done ? COLORS.textMuted : COLORS.textSecondary}
          />
          <Text
            style={[styles.visitAddress, done && styles.visitAddressDone]}
            numberOfLines={1}
          >
            {address}
          </Text>
        </View>
      </View>
      {done && (
        <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.teal} style={styles.doneIcon} />
      )}
    </View>
  );
}

export default function PlanningScreen(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'Dr';
  const todo = MOCK_VISITS.filter((v) => !v.done);
  const done = MOCK_VISITS.filter((v) => v.done);

  return (
    <View style={styles.root}>
      {/* Header teal */}
      <View style={[styles.header, { backgroundColor: COLORS.teal }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Bonjour, {firstName} 👋</Text>
              <Text style={styles.headerDate}>{formatToday()}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="account-group" size={14} color="#fff" />
                <Text style={styles.statText}>{MOCK_VISITS.length} patients</Text>
              </View>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="road-variant" size={14} color="#fff" />
                <Text style={styles.statText}>12 km</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <MaterialCommunityIcons name="map-outline" size={32} color={COLORS.textMuted} />
        <Text style={styles.mapPlaceholderText}>Carte de l'itinéraire</Text>
        <Text style={styles.mapPlaceholderSub}>Disponible avec le module Planning</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <Chip selected style={styles.filterChip} compact>Aujourd'hui</Chip>
        <Chip style={styles.filterChip} compact>Cette semaine</Chip>
      </View>

      {/* Visit lists */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>À FAIRE · {todo.length}</Text>
        {todo.length === 0 ? (
          <View style={styles.emptySection}>
            <MaterialCommunityIcons name="check-all" size={28} color={COLORS.teal} />
            <Text style={styles.emptySectionText}>Toutes les visites sont complétées !</Text>
          </View>
        ) : (
          todo.map((v) => <VisitCard key={v.id} {...v} />)
        )}

        {done.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>COMPLÉTÉS · {done.length}</Text>
            {done.map((v) => <VisitCard key={v.id} {...v} />)}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => {}}
        accessibilityLabel="Ajouter une visite"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#D1ECFA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  mapPlaceholderSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: { borderRadius: 20 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptySectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  visitCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  visitCardDone: {
    backgroundColor: '#F8FFFE',
    opacity: 0.8,
  },
  visitTime: {
    minWidth: 40,
    alignItems: 'center',
  },
  visitTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  visitTimeDone: {
    color: COLORS.textMuted,
  },
  visitDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  visitInfo: { flex: 1 },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  visitName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  visitNameDone: {
    color: COLORS.textMuted,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  visitAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  visitAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  visitAddressDone: {
    color: COLORS.textMuted,
  },
  doneIcon: { marginLeft: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
  },
});
