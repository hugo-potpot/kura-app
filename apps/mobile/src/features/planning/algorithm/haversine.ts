export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

/** Rayon terrestre en km (WGS84 approximation). */
const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Distance géodésique courte (Haversine) en kilomètres entre deux coordonnées WGS84.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

/**
 * Minutes de trajet depuis une distance en km (arrondi à l’entier positif le plus proche).
 */
export function travelMinutesFromKm(km: number, averageSpeedKmh: number): number {
  if (!Number.isFinite(km) || km <= 0 || !Number.isFinite(averageSpeedKmh) || averageSpeedKmh <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((km / averageSpeedKmh) * 60));
}
