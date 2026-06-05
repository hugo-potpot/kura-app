import { useState, useRef, useCallback } from 'react';

import { whisperService } from '../services/whisper-service';

export type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

export interface UseVoiceTransmissionResult {
  status: RecordingStatus;
  transcribedText: string | null;
  elapsedSeconds: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: (cancelled?: boolean) => Promise<void>;
  reset: () => void;
}

export function useVoiceTransmission(): UseVoiceTransmissionResult {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscribedText(null);
    setElapsedSeconds(0);
    cancelledRef.current = false;
    setStatus('recording');

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [clearTimer]);

  const stopRecording = useCallback(
    async (cancelled = false) => {
      clearTimer();
      cancelledRef.current = cancelled;

      if (cancelled) {
        setStatus('idle');
        setElapsedSeconds(0);
        return;
      }

      setStatus('transcribing');

      try {
        // WhisperService est un mock pour le prototype — retourne une phrase médicale simulée
        const text = await whisperService.transcribe('');
        setTranscribedText(text);
        setStatus('done');
      } catch {
        setError('Transcription échouée — réessayez');
        setStatus('error');
      }
    },
    [clearTimer],
  );

  const reset = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setTranscribedText(null);
    setElapsedSeconds(0);
    setError(null);
  }, [clearTimer]);

  return { status, transcribedText, elapsedSeconds, error, startRecording, stopRecording, reset };
}
