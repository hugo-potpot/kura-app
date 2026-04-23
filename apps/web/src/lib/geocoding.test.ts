import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress } from './geocoding';

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retourne lat/lng pour une adresse valide', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => [{ lat: '48.8566', lon: '2.3522' }],
    } as Response);

    const result = await geocodeAddress('12 rue de la Paix, Paris');
    expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
  });

  it('retourne null si Nominatim renvoie un tableau vide', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => [],
    } as Response);

    const result = await geocodeAddress('adresse inconnue xyz');
    expect(result).toBeNull();
  });

  it('retourne null en cas d\'erreur réseau', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await geocodeAddress('12 rue quelconque');
    expect(result).toBeNull();
  });

  it('retourne null en cas de timeout (AbortError)', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    const result = await geocodeAddress('adresse timeout');
    expect(result).toBeNull();
  });

  it('envoie le header User-Agent correct', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => [{ lat: '43.2965', lon: '5.3698' }],
    } as Response);

    await geocodeAddress('Marseille');
    const callArgs = vi.mocked(fetch).mock.calls[0];
    const options = callArgs?.[1] as RequestInit;
    expect((options.headers as Record<string, string>)['User-Agent']).toBe('KURA-App/1.0 (contact@kura.fr)');
  });
});
