import { haversineKm, travelMinutesFromKm } from './haversine';

describe('haversine', () => {
  it('should return ~0 for identical points', () => {
    const p = { latitude: 45.764, longitude: 4.8357 };
    expect(haversineKm(p, p)).toBeLessThan(0.0001);
  });

  it('should return a plausible distance Lyon–Paris corridor (ordre de grandeur)', () => {
    const lyon = { latitude: 45.764, longitude: 4.8357 };
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const km = haversineKm(lyon, paris);
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(450);
  });
});

describe('travelMinutesFromKm', () => {
  it('should convert 25 km/h to 60 min for 25 km', () => {
    expect(travelMinutesFromKm(25, 25)).toBe(60);
  });

  it('should return 0 for invalid input', () => {
    expect(travelMinutesFromKm(-1, 25)).toBe(0);
    expect(travelMinutesFromKm(10, 0)).toBe(0);
  });
});
