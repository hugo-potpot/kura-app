import { useCallback, useEffect, useState } from 'react';
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

import { COLORS } from '@/theme/kura-theme';

const STORAGE_KEY = '@kura/planning_map_section_expanded';

export interface MapVisitPin {
  orderIndex: number;
  latitude: number;
  longitude: number;
}

interface MapToggleSectionProps {
  pins: MapVisitPin[];
}

function computeRegion(pins: MapVisitPin[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (pins.length === 0) {
    return {
      latitude: 48.8566,
      longitude: 2.3522,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
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
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latDelta = Math.max((maxLat - minLat) * 1.8, 0.02);
  const lngDelta = Math.max((maxLng - minLng) * 1.8, 0.02);
  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/**
 * C7 — section carte repliable ; préférence UI persistée (pas de secrets).
 */
export function MapToggleSection({ pins }: MapToggleSectionProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw === '1') setExpanded(true);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    void AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0').catch(() => {});
  }, [expanded]);

  const region = computeRegion(pins);
  const coords = pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  const showPolyline = coords.length >= 2;

  return (
    <View style={styles.outer}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.toggleBtn, pressed && styles.togglePressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? 'Masquer la carte du trajet' : 'Voir la carte du trajet'
        }
      >
        <Text style={styles.toggleLabel} maxFontSizeMultiplier={1.5}>
          {expanded ? '🗺️ Masquer la carte ⌃' : '🗺️ Voir la carte ∨'}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={COLORS.primary}
        />
      </Pressable>

      {expanded && hydrated && (
        <View style={styles.mapBox}>
          {isWeb ? (
            <StaticPlaceholder
              title="Carte interactive disponible sur iOS et Android"
              subtitle={pins.length === 0 ? 'Aucune coordonnée GPS pour les patients du jour' : undefined}
            />
          ) : pins.length === 0 ? (
            <StaticPlaceholder title="Aucune coordonnée GPS pour tracer la carte aujourd'hui" />
          ) : (
            <>
              <MapView
                style={styles.map}
                initialRegion={region}
                onMapReady={() => setMapReady(true)}
                accessibilityLabel="Carte de la tournée du jour"
              >
                {pins.map((p) => (
                  <Marker
                    key={`${p.orderIndex}-${p.latitude}-${p.longitude}`}
                    coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                    title={`Étape ${p.orderIndex + 1}`}
                    accessibilityLabel={`Patient étape ${p.orderIndex + 1}`}
                  >
                    <View style={styles.pinBubble}>
                      <Text style={styles.pinText} maxFontSizeMultiplier={1.5}>
                        {p.orderIndex + 1}
                      </Text>
                    </View>
                  </Marker>
                ))}
                {showPolyline && (
                  <Polyline coordinates={coords} strokeColor={COLORS.teal} strokeWidth={3} />
                )}
              </MapView>
              {!mapReady && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator color={COLORS.teal} />
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function StaticPlaceholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <MaterialCommunityIcons name="map-outline" size={36} color={COLORS.textMuted} />
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
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  togglePressed: { opacity: 0.85 },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapBox: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#D1ECFA',
    marginTop: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  placeholderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243,250,255,0.6)',
  },
  pinBubble: {
    backgroundColor: COLORS.teal,
    borderRadius: 14,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pinText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
