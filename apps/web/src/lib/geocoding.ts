import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { patientsPg } from '@kura/db';

export async function geocodeAndUpdate(patientId: string, address: string): Promise<void> {
  const coords = await geocodeAddress(address);
  if (!coords) return;
  await db
    .update(patientsPg)
    .set({ latitude: coords.lat, longitude: coords.lng })
    .where(eq(patientsPg.id, patientId));
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'KURA-App/1.0 (contact@kura.fr)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
