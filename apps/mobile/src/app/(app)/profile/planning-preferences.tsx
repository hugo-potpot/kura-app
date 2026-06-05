import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

import { usePlanningPreferences } from '@/features/planning/hooks/usePlanningPreferences';
import type { PriorityZone } from '@/features/planning/hooks/planning-preferences-schema';
import { COLORS } from '@/theme/kura-theme';

function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHHMM(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = parseInt(match[1]!, 10);
  const m = parseInt(match[2]!, 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Row({ label, sublabel, children }: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function TimeField({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: number;
  onChange: (minutes: number) => void;
  accessibilityLabel: string;
}) {
  const [raw, setRaw] = useState(minutesToHHMM(value));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setRaw(minutesToHHMM(value));
  }, [value]);

  function handleBlur() {
    const parsed = parseHHMM(raw);
    if (parsed !== null) {
      setHasError(false);
      onChange(parsed);
    } else {
      setHasError(true);
      setRaw(minutesToHHMM(value));
    }
  }

  return (
    <TextInput
      style={[styles.timeInput, hasError && styles.timeInputError]}
      value={raw}
      onChangeText={setRaw}
      onBlur={handleBlur}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      accessibilityLabel={accessibilityLabel}
      placeholder="HH:MM"
      placeholderTextColor={COLORS.textMuted}
    />
  );
}

function ZoneRow({
  zone,
  index,
  onRemove,
}: {
  zone: PriorityZone;
  index: number;
  onRemove: () => void;
}) {
  return (
    <View style={styles.zoneRow}>
      <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color={COLORS.primary} />
      <Text style={styles.zoneText} numberOfLines={1}>
        {`Zone ${index + 1} · ${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)} · ${zone.radiusKm} km`}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Supprimer la zone ${index + 1}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

function AddZoneForm({ onAdd }: { onAdd: (zone: PriorityZone) => void }) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('2');
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    const radN = parseFloat(radius);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      setError('Coordonnées invalides.');
      return;
    }
    if (!Number.isFinite(radN) || radN < 0.1 || radN > 50) {
      setError('Rayon entre 0,1 et 50 km.');
      return;
    }
    setError(null);
    onAdd({ lat: latN, lng: lngN, radiusKm: radN });
    setLat('');
    setLng('');
    setRadius('2');
  }

  return (
    <View style={styles.addZoneForm}>
      <View style={styles.addZoneInputRow}>
        <TextInput
          style={[styles.coordInput, { flex: 1 }]}
          value={lat}
          onChangeText={setLat}
          placeholder="Latitude"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          accessibilityLabel="Latitude de la zone prioritaire"
        />
        <TextInput
          style={[styles.coordInput, { flex: 1 }]}
          value={lng}
          onChangeText={setLng}
          placeholder="Longitude"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          accessibilityLabel="Longitude de la zone prioritaire"
        />
        <TextInput
          style={[styles.coordInput, { width: 70 }]}
          value={radius}
          onChangeText={setRadius}
          placeholder="Rayon km"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          accessibilityLabel="Rayon de la zone prioritaire en kilomètres"
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Ajouter cette zone prioritaire"
      >
        <MaterialCommunityIcons name="plus" size={16} color="#fff" />
        <Text style={styles.addBtnText}>Ajouter la zone</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PlanningPreferencesScreen(): React.JSX.Element {
  const router = useRouter();
  const { preferences, setPreferences, preferencesReady } = usePlanningPreferences();

  if (!preferencesReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  async function handleTimeChange(field: 'dayStartMinutes' | 'pauseStartMinutes', value: number) {
    await setPreferences({ [field]: value });
  }

  async function handleLunchDurationChange(raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 240) {
      await setPreferences({ lunchDurationMinutes: n });
    }
  }

  async function handleManualModeToggle(value: boolean) {
    await setPreferences({ manualModePur: value });
  }

  async function handleAddZone(zone: PriorityZone) {
    const zones = [...preferences.priorityZones, zone];
    await setPreferences({ priorityZones: zones });
  }

  async function handleRemoveZone(index: number) {
    const zones = preferences.priorityZones.filter((_, i) => i !== index);
    await setPreferences({ priorityZones: zones });
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { backgroundColor: COLORS.primaryDark }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => { router.back(); }}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Préférences planning</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Horaires journée */}
        <SectionHeader title="HORAIRES DE LA JOURNÉE" />
        <View style={styles.card}>
          <Row
            label="Heure de début de tournée"
            sublabel="Format HH:MM"
          >
            <TimeField
              value={preferences.dayStartMinutes}
              onChange={(v) => { void handleTimeChange('dayStartMinutes', v); }}
              accessibilityLabel="Heure de début de tournée"
            />
          </Row>
          <View style={styles.divider} />
          <Row
            label="Début de pause déjeuner"
            sublabel="Format HH:MM"
          >
            <TimeField
              value={preferences.pauseStartMinutes}
              onChange={(v) => { void handleTimeChange('pauseStartMinutes', v); }}
              accessibilityLabel="Heure de début de pause déjeuner"
            />
          </Row>
          <View style={styles.divider} />
          <Row label="Durée de la pause" sublabel="En minutes (0 = pas de pause)">
            <TextInput
              style={styles.durationInput}
              value={String(preferences.lunchDurationMinutes)}
              onChangeText={(v) => { void handleLunchDurationChange(v); }}
              keyboardType="number-pad"
              maxLength={3}
              accessibilityLabel="Durée de la pause déjeuner en minutes"
            />
          </Row>
        </View>

        {/* Mode manuel */}
        <SectionHeader title="OPTIMISATION" />
        <View style={styles.card}>
          <Row
            label="Mode manuel pur"
            sublabel="Désactive l'optimisation automatique de la tournée"
          >
            <Switch
              value={preferences.manualModePur}
              onValueChange={(v) => { void handleManualModeToggle(v); }}
              accessibilityLabel={
                preferences.manualModePur
                  ? 'Désactiver le mode organisation manuelle pure'
                  : 'Activer le mode organisation manuelle pure'
              }
            />
          </Row>
        </View>

        {/* Zones prioritaires */}
        <SectionHeader title="ZONES GÉOGRAPHIQUES PRIORITAIRES" />
        <View style={styles.card}>
          <Text style={styles.zonesHint}>
            Définissez jusqu'à 3 zones (cercle lat/lng + rayon km). Les visites dans ces zones
            seront favorisées par l'algorithme d'optimisation.
          </Text>

          {preferences.priorityZones.map((zone, i) => (
            <ZoneRow
              key={i}
              zone={zone}
              index={i}
              onRemove={() => { void handleRemoveZone(i); }}
            />
          ))}

          {preferences.priorityZones.length < 3 && (
            <AddZoneForm onAdd={(z) => { void handleAddZone(z); }} />
          )}

          {preferences.priorityZones.length === 3 && (
            <Text style={styles.zoneMaxHint}>Maximum 3 zones atteint.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted },

  header: { paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { flex: 1 },
  rowLabelText: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  rowSublabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#EEF2F7', marginLeft: 16 },

  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    width: 80,
    textAlign: 'center',
  },
  timeInputError: { borderColor: COLORS.error },

  durationInput: {
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    width: 70,
    textAlign: 'center',
  },

  zonesHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    lineHeight: 20,
  },

  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF2F7',
  },
  zoneText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },

  addZoneForm: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF2F7',
    gap: 8,
  },
  addZoneInputRow: { flexDirection: 'row', gap: 8 },
  coordInput: {
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  errorText: { fontSize: 12, color: COLORS.error },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    minHeight: 44,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  zoneMaxHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 14,
    fontStyle: 'italic',
  },
});
