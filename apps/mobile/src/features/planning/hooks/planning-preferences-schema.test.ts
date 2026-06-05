import {
  PlanningPreferencesSchema,
  PriorityZoneSchema,
  DEFAULT_PLANNING_PREFERENCES,
} from './planning-preferences-schema';

describe('PlanningPreferencesSchema', () => {
  it('valide des préférences complètes valides', () => {
    const result = PlanningPreferencesSchema.safeParse({
      dayStartMinutes: 8 * 60,
      pauseStartMinutes: 12 * 60 + 30,
      lunchDurationMinutes: 30,
      manualModePur: false,
      priorityZones: [],
    });
    expect(result.success).toBe(true);
  });

  it('applique les valeurs par défaut si objet vide', () => {
    const result = PlanningPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dayStartMinutes).toBe(8 * 60);
      expect(result.data.lunchDurationMinutes).toBe(30);
      expect(result.data.manualModePur).toBe(false);
      expect(result.data.priorityZones).toEqual([]);
    }
  });

  it('rejette dayStartMinutes négatif', () => {
    const result = PlanningPreferencesSchema.safeParse({ dayStartMinutes: -1 });
    expect(result.success).toBe(false);
  });

  it('rejette lunchDurationMinutes > 240', () => {
    const result = PlanningPreferencesSchema.safeParse({ lunchDurationMinutes: 300 });
    expect(result.success).toBe(false);
  });

  it('accepte lunchDurationMinutes = 0 (pas de pause)', () => {
    const result = PlanningPreferencesSchema.safeParse({ lunchDurationMinutes: 0 });
    expect(result.success).toBe(true);
  });

  it('rejette plus de 3 zones prioritaires', () => {
    const zone = { lat: 45.0, lng: 4.0, radiusKm: 2 };
    const result = PlanningPreferencesSchema.safeParse({
      priorityZones: [zone, zone, zone, zone],
    });
    expect(result.success).toBe(false);
  });

  it('sérialise et désérialise correctement (round-trip)', () => {
    const prefs = DEFAULT_PLANNING_PREFERENCES;
    const json = JSON.stringify(prefs);
    const result = PlanningPreferencesSchema.safeParse(JSON.parse(json) as unknown);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(prefs);
    }
  });
});

describe('PriorityZoneSchema', () => {
  it('valide une zone avec coordonnées et rayon valides', () => {
    expect(PriorityZoneSchema.safeParse({ lat: 45.76, lng: 4.83, radiusKm: 2.5 }).success).toBe(true);
  });

  it('rejette un rayon < 0.1', () => {
    expect(PriorityZoneSchema.safeParse({ lat: 45.76, lng: 4.83, radiusKm: 0.05 }).success).toBe(false);
  });

  it('rejette un rayon > 50', () => {
    expect(PriorityZoneSchema.safeParse({ lat: 45.76, lng: 4.83, radiusKm: 60 }).success).toBe(false);
  });
});
