import { usePlanningUxSession } from './planning-ux-session';

describe('usePlanningUxSession', () => {
  beforeEach(() => {
    usePlanningUxSession.setState({
      sessionDateKey: null,
      hasManuallyReordered: false,
      firstFocusOptimizeRanForDateKey: null,
    });
  });

  it('allows first-focus only once per day', () => {
    const dk = '2026-04-28';
    usePlanningUxSession.getState().syncSessionDate(dk);
    expect(usePlanningUxSession.getState().peekEligibleFirstFocusOptimize(dk)).toBe(true);
    usePlanningUxSession.getState().markFirstFocusOptimizeRan(dk);
    expect(usePlanningUxSession.getState().peekEligibleFirstFocusOptimize(dk)).toBe(false);
  });

  it('blocks first-focus after manual reorder', () => {
    const dk = '2026-04-28';
    usePlanningUxSession.getState().syncSessionDate(dk);
    usePlanningUxSession.getState().markManualReorder();
    expect(usePlanningUxSession.getState().peekEligibleFirstFocusOptimize(dk)).toBe(false);
  });

  it('resets manual flag when day changes', () => {
    usePlanningUxSession.getState().syncSessionDate('2026-04-27');
    usePlanningUxSession.getState().markManualReorder();
    expect(usePlanningUxSession.getState().hasManuallyReordered).toBe(true);
    usePlanningUxSession.getState().syncSessionDate('2026-04-28');
    expect(usePlanningUxSession.getState().hasManuallyReordered).toBe(false);
  });
});
