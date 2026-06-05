import {
  computeLunchBreak,
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

  it('insère la pause déjeuner dès que l\'arrivée atteint le créneau de pause', () => {
    const sorted = sortEntryEtaSlices([
      { orderIndex: 0, etaMinutes: 60 }, // arrivée 08:00
      { orderIndex: 1, etaMinutes: 60 }, // arrivée 09:00
      { orderIndex: 2, etaMinutes: 60 }, // arrivée 10:00
      { orderIndex: 3, etaMinutes: 60 }, // arrivée ≥ 12:30 → pause insérée avant
    ]);
    const opts = { pauseStartMinutes: 12 * 60 + 30, lunchDurationMinutes: 45 };
    // 08:00 + 4×60 = 12:00 pour la visite #4 sans pause ; mais #4 n'atteint pas encore 12:30.
    expect(estimatedVisitClockMinutes(3, sorted, 8 * 60, opts)).toBe(8 * 60 + 180); // 11:00, pas de pause
    // Une 5e visite franchit 12:30 → pause appliquée
    const sorted5 = sortEntryEtaSlices([...sorted, { orderIndex: 4, etaMinutes: 60 }]);
    // arrivée #5 brute = 08:00 + 4×60 = 12:00 ; toujours < 12:30 → pas de pause
    expect(estimatedVisitClockMinutes(4, sorted5, 8 * 60, opts)).toBe(12 * 60);
    const sorted6 = sortEntryEtaSlices([...sorted5, { orderIndex: 5, etaMinutes: 60 }]);
    // arrivée #6 brute = 13:00 ≥ 12:30 → +45 → 13:45
    expect(estimatedVisitClockMinutes(5, sorted6, 8 * 60, opts)).toBe(13 * 60 + 45);
  });

  it('sans durée de pause, le comportement reste inchangé', () => {
    const sorted = sortEntryEtaSlices([
      { orderIndex: 0, etaMinutes: 60 },
      { orderIndex: 1, etaMinutes: 60 },
    ]);
    const opts = { pauseStartMinutes: 12 * 60 + 30, lunchDurationMinutes: 0 };
    expect(estimatedVisitClockMinutes(1, sorted, 8 * 60, opts)).toBe(9 * 60);
  });

  it('computeLunchBreak repère la visite suivant la pause et son horaire', () => {
    const sorted = sortEntryEtaSlices([
      { orderIndex: 0, etaMinutes: 60 }, // 08:00 → fin 09:00
      { orderIndex: 1, etaMinutes: 60 }, // 09:00 → fin 10:00
      { orderIndex: 2, etaMinutes: 90 }, // 10:00 → fin 11:30
      { orderIndex: 3, etaMinutes: 60 }, // 11:30 → fin 12:30
      { orderIndex: 4, etaMinutes: 60 }, // arrivée 12:30 ≥ pause → pause AVANT #4
    ]);
    const opts = { pauseStartMinutes: 12 * 60 + 30, lunchDurationMinutes: 45 };
    const br = computeLunchBreak(sorted, 8 * 60, opts);
    expect(br).toEqual({ beforeOrderIndex: 4, startMinutes: 12 * 60 + 30, durationMinutes: 45 });
  });

  it('computeLunchBreak renvoie null sans pause configurée', () => {
    const sorted = sortEntryEtaSlices([{ orderIndex: 0, etaMinutes: 60 }]);
    expect(computeLunchBreak(sorted, 8 * 60, { pauseStartMinutes: 12 * 60, lunchDurationMinutes: 0 })).toBeNull();
  });

  it('computeLunchBreak renvoie null si la pause tombe après la dernière visite', () => {
    const sorted = sortEntryEtaSlices([
      { orderIndex: 0, etaMinutes: 30 },
      { orderIndex: 1, etaMinutes: 30 },
    ]);
    expect(computeLunchBreak(sorted, 8 * 60, { pauseStartMinutes: 12 * 60 + 30, lunchDurationMinutes: 30 })).toBeNull();
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
