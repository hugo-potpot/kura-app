import {
  estimatedVisitClockMinutes,
  formatPlanningDateKey,
  minutesToClockLabel,
  PLANNING_DAY_START_MINUTES,
  shortenAddress,
  sortEntryEtaSlices,
  sumEtaMinutes,
} from './planning-utils';

describe('planning-utils', () => {
  it('formatPlanningDateKey produit YYYY-MM-DD', () => {
    const d = new Date(2026, 3, 28); // mois 0-based
    expect(formatPlanningDateKey(d)).toBe('2026-04-28');
  });

  it("calcule l'heure estimee avec creneau 08h + cumul eta precedentes", () => {
    const sorted = sortEntryEtaSlices([
      { orderIndex: 0, etaMinutes: 15 },
      { orderIndex: 1, etaMinutes: 10 },
    ]);
    expect(estimatedVisitClockMinutes(0, sorted)).toBe(PLANNING_DAY_START_MINUTES);
    expect(estimatedVisitClockMinutes(1, sorted)).toBe(PLANNING_DAY_START_MINUTES + 15);
  });

  it('utilise le dayStartMinutes personnalise (preference)', () => {
    const sorted = sortEntryEtaSlices([
      { orderIndex: 0, etaMinutes: 20 },
      { orderIndex: 1, etaMinutes: 10 },
    ]);
    const customStart = 7 * 60 + 30; // 07:30
    expect(estimatedVisitClockMinutes(0, sorted, customStart)).toBe(customStart);
    expect(estimatedVisitClockMinutes(1, sorted, customStart)).toBe(customStart + 20);
  });

  it('minutesToClockLabel formate correctement', () => {
    expect(minutesToClockLabel(8 * 60 + 30)).toBe('08:30');
  });

  it('sumEtaMinutes additionne les segments', () => {
    expect(sumEtaMinutes([{ etaMinutes: 10 }, { etaMinutes: null }])).toBe(10);
  });

  it('shortenAddress tronque les longues chaines', () => {
    const long = `${'x'.repeat(50)}, ville`;
    expect(shortenAddress(long, 10).length).toBeLessThanOrEqual(11);
  });
});
