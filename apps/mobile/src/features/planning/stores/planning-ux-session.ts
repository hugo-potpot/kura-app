import { create } from 'zustand';

/**
 * Session planning (jour courant / premier focus auto / drag manuel — story 4.3).
 */
interface PlanningUxSessionState {
  sessionDateKey: string | null;
  hasManuallyReordered: boolean;
  firstFocusOptimizeRanForDateKey: string | null;
}

interface PlanningUxSessionActions {
  /** Si la date métier change, réinitialise le flag drag et le slot premier focus. */
  syncSessionDate: (dateKey: string) => void;
  markManualReorder: () => void;
  /** true si l’auto-optim premier focus du jour peut encore s’exécuter (sans effet de bord). */
  peekEligibleFirstFocusOptimize: (dateKey: string) => boolean;
  /** Après un premier focus auto réussi pour ce jour. */
  markFirstFocusOptimizeRan: (dateKey: string) => void;
}

export const usePlanningUxSession = create<PlanningUxSessionState & PlanningUxSessionActions>((set, get) => ({
  sessionDateKey: null,
  hasManuallyReordered: false,
  firstFocusOptimizeRanForDateKey: null,

  syncSessionDate: (dateKey: string): void => {
    const prev = get().sessionDateKey;
    if (prev !== null && prev !== dateKey) {
      set({
        sessionDateKey: dateKey,
        hasManuallyReordered: false,
        firstFocusOptimizeRanForDateKey: null,
      });
    } else if (prev === null) {
      set({ sessionDateKey: dateKey });
    }
  },

  markManualReorder: (): void => {
    set({ hasManuallyReordered: true });
  },

  peekEligibleFirstFocusOptimize: (dateKey: string): boolean => {
    const s = get();
    if (s.hasManuallyReordered) return false;
    if (s.firstFocusOptimizeRanForDateKey === dateKey) return false;
    return true;
  },

  markFirstFocusOptimizeRan: (dateKey: string): void => {
    set({ firstFocusOptimizeRanForDateKey: dateKey });
  },
}));
