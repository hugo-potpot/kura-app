export interface AddressSuggestion {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 5) return [];
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'fr');
    url.searchParams.set('addressdetails', '0');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'KURA-App/1.0 (contact@kura.fr)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = (await res.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
    return data.map((r) => ({ placeId: r.place_id, displayName: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }));
  } catch {
    return [];
  }
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
