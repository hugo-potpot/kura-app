import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  mapPinAccessibilityLabel,
  pinColorForStatus,
  type PlanningMapPin,
} from '@/features/planning/utils/planning-map-pins';
import { COLORS } from '@/theme/kura-theme';

const STORAGE_KEY = '@kura/planning_map_section_expanded';

export type { PlanningMapPin } from '@/features/planning/utils/planning-map-pins';

// ── routage OSRM (route réelle sur le réseau routier) ────────────────────────

type LatLng = { latitude: number; longitude: number };

async function fetchRoadRoute(waypoints: LatLng[]): Promise<LatLng[]> {
  if (waypoints.length < 2) return waypoints;
  const coordStr = waypoints.map((c) => `${c.longitude},${c.latitude}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json() as {
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  const pts = data.routes?.[0]?.geometry?.coordinates;
  if (!pts || pts.length === 0) throw new Error('OSRM: no route');
  return pts.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

interface MapToggleSectionProps {
  pins: PlanningMapPin[];
  onPinSelect?: (entryId: string) => void;
  onNavigateNext?: () => void;
  canNavigateNext?: boolean;
}

function computeRegion(pins: PlanningMapPin[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (pins.length === 0) {
    return { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }
  let minLat = pins[0]?.latitude ?? 0;
  let maxLat = minLat;
  let minLng = pins[0]?.longitude ?? 0;
  let maxLng = minLng;
  for (const p of pins) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.02),
  };
}

// ── légende ──────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: COLORS.primary, label: 'À faire' },
  { color: '#2E7D32', label: 'Terminé' },
  { color: '#FB8C00', label: 'Absent' },
] as const;

function MapLegend(): React.JSX.Element {
  return (
    <View style={styles.legend} accessibilityLabel="Légende de la carte">
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendLabel} maxFontSizeMultiplier={1.3}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── pin personnalisé ──────────────────────────────────────────────────────────

function PinMarker({
  pin,
  isNext,
}: {
  pin: PlanningMapPin;
  isNext: boolean;
}): React.JSX.Element {
  const bg = pinColorForStatus(pin.status);

  // Icône selon statut
  let icon: React.ReactNode;
  if (pin.status === 'done') {
    icon = <MaterialCommunityIcons name="check" size={isNext ? 16 : 13} color="#fff" />;
  } else if (pin.status === 'skipped') {
    icon = <MaterialCommunityIcons name="close" size={isNext ? 16 : 13} color="#fff" />;
  } else {
    icon = (
      <Text style={[styles.pinNumber, isNext && styles.pinNumberLarge]} maxFontSizeMultiplier={1}>
        {pin.orderIndex + 1}
      </Text>
    );
  }

  return (
    <View style={styles.pinWrapper}>
      {isNext && (
        <View style={styles.nextLabel}>
          <Text style={styles.nextLabelText} maxFontSizeMultiplier={1}>
            Prochain
          </Text>
        </View>
      )}
      <View
        style={[
          styles.pinBubble,
          { backgroundColor: bg },
          isNext && styles.pinBubbleNext,
        ]}
      >
        {icon}
      </View>
      {/* Pointe du pin */}
      <View style={[styles.pinTip, { borderTopColor: bg }]} />
    </View>
  );
}

// ── composant principal ───────────────────────────────────────────────────────

export function MapToggleSection({
  pins,
  onPinSelect,
  onNavigateNext,
  canNavigateNext = false,
}: MapToggleSectionProps): React.JSX.Element {
  // Ouvert par défaut pour les nouveaux utilisateurs
  const [expanded, setExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  // Position GPS actuelle de l'IDEL
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  // Géométrie routière réelle (OSRM) ; null = non encore chargée, [] = fallback lignes droites
  const [roadCoords, setRoadCoords] = useState<LatLng[] | null>(null);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        // null = première ouverture → garder expanded=true
        if (!cancelled && raw === '0') setExpanded(false);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    void AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0').catch(() => {});
  }, [expanded]);

  const region = computeRegion(pins);

  // Premier pin à faire (prochain dans la tournée)
  const nextPin = useMemo(
    () => pins.find((p) => p.status === 'pending' || p.status === 'in_progress') ?? null,
    [pins],
  );

  // Tracé uniquement de la position actuelle vers le prochain patient
  const routeWaypoints = useMemo<LatLng[]>(() => {
    if (userCoords === null || nextPin === null) return [];
    return [userCoords, { latitude: nextPin.latitude, longitude: nextPin.longitude }];
  }, [userCoords, nextPin]);

  const showPolyline = routeWaypoints.length === 2;

  // Clé stable arrondie à 4 décimales (~11 m) pour éviter de re-fetcher sur le moindre jitter GPS
  const waypointKey = useMemo(
    () => routeWaypoints.map((c) => `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`).join('|'),
    [routeWaypoints],
  );

  useEffect(() => {
    if (!showPolyline || isWeb) return;
    let cancelled = false;
    setRoadCoords(null); // reset pendant le chargement
    void fetchRoadRoute(routeWaypoints)
      .then((pts) => { if (!cancelled) setRoadCoords(pts); })
      .catch(() => { if (!cancelled) setRoadCoords([]); }); // [] = fallback lignes droites
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypointKey, showPolyline, isWeb]);

  const showNextNav = !isWeb && onNavigateNext !== undefined;

  const doneCount = pins.filter((p) => p.status === 'done').length;
  const totalCount = pins.length;
  const progressLabel = totalCount > 0 ? `${doneCount}/${totalCount} visites` : '';

  return (
    <View style={styles.outer}>
      {/* ── Bouton d'ouverture ── */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.toggleBtn, pressed && styles.togglePressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? 'Fermer la carte de ma tournée' : 'Voir ma tournée sur la carte'
        }
      >
        <View style={styles.toggleLeft}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={22}
            color={COLORS.primary}
          />
          <View>
            <Text style={styles.toggleTitle} maxFontSizeMultiplier={1.5}>
              {expanded ? 'Fermer la carte' : 'Voir ma tournée sur la carte'}
            </Text>
            {!expanded && progressLabel.length > 0 && (
              <Text style={styles.toggleSub} maxFontSizeMultiplier={1.3}>
                {progressLabel} · Appuyez pour afficher
              </Text>
            )}
          </View>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.primary}
        />
      </Pressable>

      {expanded && hydrated && (
        <View style={styles.mapCard}>
          {isWeb ? (
            <StaticPlaceholder
              title="Carte disponible sur l'application mobile (iOS et Android)"
            />
          ) : pins.length === 0 ? (
            <StaticPlaceholder
              icon="map-marker-off-outline"
              title="Pas de carte disponible"
              subtitle="Les adresses de vos patients ne sont pas encore géolocalisées."
            />
          ) : (
            <>
              {/* ── Bouton navigation prochain patient ── */}
              {showNextNav && (
                <Pressable
                  onPress={() => { onNavigateNext?.(); }}
                  disabled={!canNavigateNext}
                  style={({ pressed }) => [
                    styles.navBtn,
                    canNavigateNext && pressed && styles.navBtnPressed,
                    !canNavigateNext && styles.navBtnDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canNavigateNext }}
                  accessibilityLabel="Lancer la navigation GPS vers le prochain patient"
                >
                  <MaterialCommunityIcons
                    name="navigation-variant"
                    size={20}
                    color={canNavigateNext ? '#fff' : COLORS.textMuted}
                  />
                  <Text
                    style={[styles.navBtnText, !canNavigateNext && styles.navBtnTextDisabled]}
                    maxFontSizeMultiplier={1.3}
                  >
                    {canNavigateNext
                      ? 'Aller chez le prochain patient'
                      : 'Tous les patients ont été visités'}
                  </Text>
                </Pressable>
              )}

              {/* ── Carte ── */}
              <View style={styles.mapWrap}>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={region}
                  showsUserLocation={true}
                  followsUserLocation={false}
                  onUserLocationChange={(e) => {
                    const c = e.nativeEvent.coordinate;
                    if (c) setUserCoords({ latitude: c.latitude, longitude: c.longitude });
                  }}
                  onMapReady={() => setMapReady(true)}
                  accessibilityLabel="Carte de votre tournée du jour"
                >
                  {/* Tracé vers le prochain patient : route réelle (OSRM) ou ligne droite en fallback */}
                  {showPolyline && roadCoords !== null && (
                    <Polyline
                      coordinates={roadCoords.length > 0 ? roadCoords : routeWaypoints}
                      strokeColor={COLORS.primary}
                      strokeWidth={3}
                    />
                  )}

                  {/* Pins patients */}
                  {pins.map((p) => (
                    <Marker
                      key={p.entryId}
                      coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                      title={`${p.patientFirstName} ${p.patientLastName}`}
                      description={
                        p.status === 'done'
                          ? '✓ Visite terminée'
                          : p.status === 'skipped'
                          ? 'Patient absent'
                          : `Étape ${p.orderIndex + 1} de votre tournée`
                      }
                      tracksViewChanges={false}
                      accessibilityLabel={mapPinAccessibilityLabel(p.orderIndex, p.status)}
                      onPress={() => { onPinSelect?.(p.entryId); }}
                    >
                      <PinMarker pin={p} isNext={p.entryId === nextPin?.entryId} />
                    </Marker>
                  ))}
                </MapView>

                {!mapReady && (
                  <View style={styles.loaderOverlay}>
                    <ActivityIndicator color={COLORS.teal} />
                    <Text style={styles.loaderText} maxFontSizeMultiplier={1.3}>
                      Chargement de la carte…
                    </Text>
                  </View>
                )}
              </View>

              {/* ── Légende ── */}
              <MapLegend />
            </>
          )}
        </View>
      )}
    </View>
  );
}

function StaticPlaceholder({
  icon = 'map-outline',
  title,
  subtitle,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
}): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <MaterialCommunityIcons name={icon as never} size={40} color={COLORS.textMuted} />
      <Text style={styles.placeholderTitle} maxFontSizeMultiplier={1.5}>
        {title}
      </Text>
      {subtitle !== undefined && (
        <Text style={styles.placeholderSub} maxFontSizeMultiplier={1.5}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // ── Toggle ──
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  togglePressed: { opacity: 0.85 },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toggleSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ── Carte ──
  mapCard: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E8F4FD',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  mapWrap: {
    height: 230,
    position: 'relative',
  },

  // ── Bouton navigation ──
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.teal,
  },
  navBtnPressed: { opacity: 0.88 },
  navBtnDisabled: { backgroundColor: '#E2E8F0' },
  navBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  navBtnTextDisabled: { color: COLORS.textMuted },

  // ── Loader ──
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(232,244,253,0.85)',
  },
  loaderText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // ── Légende ──
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,23,42,0.08)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ── Pins ──
  pinWrapper: {
    alignItems: 'center',
  },
  nextLabel: {
    backgroundColor: COLORS.teal,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  nextLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pinBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },
  pinBubbleNext: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  pinNumber: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  pinNumberLarge: {
    fontSize: 16,
  },

  // ── Placeholder ──
  placeholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
