jest.mock('@/lib/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: (sel: (s: { user: { id: string } | null }) => unknown) =>
    sel({ user: { id: 'idel-1' } }),
}));

jest.mock('../services/applyPlanningDayEtaRecalculation', () => ({
  applyPlanningDayEtaRecalculation: jest.fn().mockResolvedValue(undefined),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { getDb } from '@/lib/db';

import { applyPlanningDayEtaRecalculation } from '../services/applyPlanningDayEtaRecalculation';
import { useCompleteVisit } from './useCompleteVisit';

describe('useCompleteVisit', () => {
  let whereResolved: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    whereResolved = jest.fn().mockResolvedValue(undefined);
    (getDb as jest.Mock).mockResolvedValue({
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: whereResolved,
        })),
      })),
    });
  });

  it('markDone met à jour le statut done, recalcule les ETA et affiche le snackbar', async () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useCompleteVisit(refetch));

    await act(async () => {
      await result.current.markDone('entry-1', 'pending');
    });

    expect(getDb).toHaveBeenCalled();
    expect(whereResolved).toHaveBeenCalled();
    expect(applyPlanningDayEtaRecalculation).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(result.current.doneSnackbarVisible).toBe(true);
  });

  it('onDoneUndoPress restaure le statut précédent et recalcule', async () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useCompleteVisit(refetch));

    await act(async () => {
      await result.current.markDone('entry-1', 'in_progress');
    });

    await act(async () => {
      await result.current.onDoneUndoPress();
    });

    await waitFor(() => {
      expect(result.current.doneSnackbarVisible).toBe(false);
    });

    expect(applyPlanningDayEtaRecalculation).toHaveBeenCalledTimes(2);
    expect(refetch).toHaveBeenCalledTimes(2);
    expect(result.current.doneInfoMessage).toBe('Soin annulé');
  });

  it('onDoneSnackbarDismiss ferme le snackbar sans annuler', async () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useCompleteVisit(refetch));

    await act(async () => {
      await result.current.markDone('entry-2', 'pending');
    });

    act(() => {
      result.current.onDoneSnackbarDismiss();
    });

    await waitFor(() => {
      expect(result.current.doneSnackbarVisible).toBe(false);
    });
    // refetch appelé une seule fois (pas d'annulation)
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
