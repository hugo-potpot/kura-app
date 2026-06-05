import { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/theme/kura-theme';
import type { RecordingStatus } from '../hooks/useVoiceTransmission';

const CANCEL_THRESHOLD_Y = -60; // pixels vers le haut pour annuler

interface VoiceRecorderButtonProps {
  status: RecordingStatus;
  elapsedSeconds: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function VoiceRecorderButton({
  status,
  elapsedSeconds,
  onStart,
  onStop,
  onCancel,
}: VoiceRecorderButtonProps): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cancelAnim = useRef(new Animated.Value(0)).current; // opacité hint annulation
  const isCancellingRef = useRef(false);

  // Pulsation rouge en recording
  useEffect(() => {
    if (status !== 'recording') {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulseAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        isCancellingRef.current = false;
        onStart();
        Animated.timing(cancelAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      },

      onPanResponderMove: (_e, gs) => {
        if (gs.dy < CANCEL_THRESHOLD_Y && !isCancellingRef.current) {
          isCancellingRef.current = true;
        }
      },

      onPanResponderRelease: () => {
        Animated.timing(cancelAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        if (isCancellingRef.current) {
          onCancel();
        } else {
          onStop();
        }
      },

      onPanResponderTerminate: () => {
        Animated.timing(cancelAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        onCancel();
      },
    }),
  ).current;

  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';

  const buttonColor = isRecording ? '#E53935' : COLORS.primary;

  return (
    <View style={styles.container}>
      {/* Hint "Glissez ↑ pour annuler" */}
      <Animated.View style={[styles.cancelHint, { opacity: cancelAnim }]}>
        <MaterialCommunityIcons name="arrow-up" size={16} color={COLORS.textMuted} />
        <Text style={styles.cancelHintText}>Glissez ↑ pour annuler</Text>
      </Animated.View>

      {/* Timer */}
      {isRecording && (
        <Text style={styles.timer} maxFontSizeMultiplier={1}>
          {formatSeconds(elapsedSeconds)}
        </Text>
      )}

      {/* Spinner transcription */}
      {isTranscribing && (
        <Text style={styles.transcribingLabel} maxFontSizeMultiplier={1.2}>
          Transcription en cours…
        </Text>
      )}

      {/* Bouton principal */}
      <Animated.View
        {...(status === 'idle' || status === 'recording' ? panResponder.panHandlers : {})}
        style={[
          styles.btnOuter,
          { transform: [{ scale: isRecording ? pulseAnim : 1 }] },
        ]}
      >
        <View style={[styles.btnInner, { backgroundColor: buttonColor }]}>
          {isTranscribing ? (
            <MaterialCommunityIcons name="loading" size={28} color="#fff" />
          ) : (
            <MaterialCommunityIcons
              name={isRecording ? 'record' : 'microphone'}
              size={28}
              color="#fff"
            />
          )}
        </View>
      </Animated.View>

      {/* Label sous le bouton */}
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        {isRecording
          ? 'Relâchez pour transcrire'
          : isTranscribing
          ? ''
          : 'Maintenez pour dicter'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  cancelHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelHintText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  timer: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E53935',
    letterSpacing: 2,
    minWidth: 60,
    textAlign: 'center',
  },
  transcribingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  btnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
