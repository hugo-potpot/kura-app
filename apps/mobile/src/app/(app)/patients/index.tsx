import { useState, useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Searchbar, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { usePatients } from '@/features/patients/hooks/usePatients';
import { PatientCard } from '@/features/patients/components/PatientCard';
import { EmptyPatients } from '@/features/patients/components/EmptyPatients';
import { COLORS } from '@/theme/kura-theme';
import type { Patient } from '@kura/shared';

type StatusFilter = 'active' | 'archived' | undefined;

export default function PatientsScreen(): React.JSX.Element {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: patients = [], isLoading, refetch } = usePatients({
    search: debouncedSearch,
    status: statusFilter,
  });

  const handleSearchChange = useCallback((text: string): void => {
    setSearchText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 300);
  }, []);

  const handleClearSearch = useCallback((): void => {
    setSearchText('');
    setDebouncedSearch('');
  }, []);

  const handlePatientPress = useCallback((patient: Patient): void => {
    router.push(`/patients/${patient.id}`);
  }, [router]);

  const isSearchActive = searchText.trim().length > 0;

  return (
    <View style={styles.root}>
      {/* Header indigo */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Patients</Text>
              <Text style={styles.headerSub}>
                {patients.length} patient{patients.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/patients/new')}
              accessibilityLabel="Ajouter un patient"
            >
              <MaterialCommunityIcons name="plus" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Rechercher un patient..."
        value={searchText}
        onChangeText={handleSearchChange}
        onClearIconPress={handleClearSearch}
        style={styles.searchbar}
        accessibilityLabel="Barre de recherche patients"
      />

      {/* Status filter */}
      <View style={styles.chips}>
        <Chip
          selected={statusFilter === undefined}
          onPress={() => setStatusFilter(undefined)}
          style={styles.chip}
          accessibilityLabel="Tous les patients"
        >
          Tous
        </Chip>
        <Chip
          selected={statusFilter === 'active'}
          onPress={() => setStatusFilter('active')}
          style={styles.chip}
          accessibilityLabel="Patients actifs"
        >
          Actifs
        </Chip>
        <Chip
          selected={statusFilter === 'archived'}
          onPress={() => setStatusFilter('archived')}
          style={styles.chip}
          accessibilityLabel="Patients archivés"
        >
          Archivés
        </Chip>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            searchTerm={debouncedSearch}
            onPress={() => handlePatientPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyPatients isSearch={isSearchActive} onClear={handleClearSearch} />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={patients.length === 0 ? styles.emptyContainer : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: { backgroundColor: COLORS.primaryDark, paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchbar: { margin: 12, elevation: 1 },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  chip: { borderRadius: 20 },
  list: { paddingVertical: 8, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1 },
});
