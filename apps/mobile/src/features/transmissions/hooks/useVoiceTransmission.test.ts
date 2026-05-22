import { renderHook, act } from '@testing-library/react-native';

// expo-av est stubé via moduleNameMapper (test-utils/expo-av-stub.js)
jest.mock('../services/whisper-service', () => ({
  whisperService: {
    transcribe: jest.fn().mockResolvedValue('Pansement changé. Plaie propre.'),
  },
}));

import { useVoiceTransmission } from './useVoiceTransmission';

describe('useVoiceTransmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  it('démarre en statut idle', () => {
    const { result } = renderHook(() => useVoiceTransmission());
    expect(result.current.status).toBe('idle');
    expect(result.current.transcribedText).toBeNull();
    expect(result.current.elapsedSeconds).toBe(0);
  });

  it('passe à recording puis done après start + stop', async () => {
    const { result } = renderHook(() => useVoiceTransmission());

    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.status).toBe('recording');

    await act(async () => {
      await result.current.stopRecording(false);
    });
    expect(result.current.status).toBe('done');
    expect(result.current.transcribedText).toBe('Pansement changé. Plaie propre.');
  });

  it('annulation remet le statut à idle sans texte', async () => {
    const { result } = renderHook(() => useVoiceTransmission());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      await result.current.stopRecording(true);
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.transcribedText).toBeNull();
  });

  it('reset remet tout à zéro depuis done', async () => {
    const { result } = renderHook(() => useVoiceTransmission());

    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording(false);
    });
    expect(result.current.status).toBe('done');

    act(() => { result.current.reset(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.transcribedText).toBeNull();
    expect(result.current.elapsedSeconds).toBe(0);
  });
});
