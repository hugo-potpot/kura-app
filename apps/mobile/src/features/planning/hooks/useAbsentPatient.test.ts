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
import { useAbsentPatient } from './useAbsentPatient';

describe('useAbsentPatient', () => {
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

  it('confirmAndMarkAbsent met à jour skipped, recalcule les ETA et affiche le snackbar', async () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useAbsentPatient(refetch));

    await act(async () => {
      await result.current.confirmAndMarkAbsent('entry-1', 'pending');
    });

    expect(getDb).toHaveBeenCalled();
    expect(applyPlanningDayEtaRecalculation).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(result.current.absentSnackbarVisible).toBe(true);
    expect(result.current.absentSnackbarMessage).toContain('Patient retiré');
  });

  it('onAbsentUndoPress restaure le statut et recalcule', async () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useAbsentPatient(refetch));

    await act(async () => {
      await result.current.confirmAndMarkAbsent('entry-1', 'in_progress');
    });

    await act(async () => {
      await result.current.onAbsentUndoPress();
    });

    await waitFor(() => {
      expect(result.current.absentSnackbarVisible).toBe(false);
    });

    expect(applyPlanningDayEtaRecalculation).toHaveBeenCalledTimes(2);
    expect(refetch).toHaveBeenCalledTimes(2);
    expect(result.current.absentInfoMessage).toBe('Retrait annulé');
  });
});
