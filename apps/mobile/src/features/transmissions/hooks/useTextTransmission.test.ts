import { renderHook, act } from '@testing-library/react-native';

jest.mock('@/lib/db', () => ({
  getDb: jest.fn().mockResolvedValue({
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    }),
  }),
}));

jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: jest.fn((sel: (s: { user: { id: string } }) => unknown) =>
    sel({ user: { id: 'user-test-1' } }),
  ),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@kura/shared', () => ({
  generateId: jest.fn().mockReturnValue('tx-generated-id'),
}));

import { useTextTransmission } from './useTextTransmission';

describe('useTextTransmission', () => {
  beforeEach(() => jest.clearAllMocks());

  it('démarre en statut idle', () => {
    const { result } = renderHook(() => useTextTransmission());
    expect(result.current.saveStatus).toBe('idle');
  });

  it('passe à done et retourne un id après save réussie', async () => {
    const { result } = renderHook(() => useTextTransmission());

    let savedId: string | null = null;
    await act(async () => {
      savedId = await result.current.save('patient-1', 'toilette', {
        observations: 'Patient stable',
        etat_peau: 'Bonne',
      });
    });

    expect(result.current.saveStatus).toBe('done');
    expect(savedId).toBe('tx-generated-id');
  });

  it('retourne null si le contenu formaté est vide', async () => {
    const { result } = renderHook(() => useTextTransmission());

    let savedId: string | null = 'not-null';
    await act(async () => {
      // texte vide → formatTemplateFields retourne '' → save doit retourner null
      savedId = await result.current.save('patient-1', 'autre', { texte: '   ' });
    });

    expect(savedId).toBeNull();
  });

  it('reset remet saveStatus à idle', async () => {
    const { result } = renderHook(() => useTextTransmission());

    await act(async () => {
      await result.current.save('patient-1', 'pansement', { plaie: 'plaie', etat: 'stable', produit: 'Mepilex', evolution: 'stable' });
    });
    expect(result.current.saveStatus).toBe('done');

    act(() => result.current.reset());
    expect(result.current.saveStatus).toBe('idle');
  });
});
