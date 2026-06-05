import * as ExpoHaptics from 'expo-haptics';

export type HapticLevel = 'light' | 'medium' | 'heavy';

/**
 * Wrappe expo-haptics avec des styles d’impact homogènes (story planning 4.3).
 */
export function useHaptics(): {
  trigger: (level: HapticLevel) => void;
} {
  const trigger = (level: HapticLevel): void => {
    const style =
      level === 'light'
        ? ExpoHaptics.ImpactFeedbackStyle.Light
        : level === 'medium'
          ? ExpoHaptics.ImpactFeedbackStyle.Medium
          : ExpoHaptics.ImpactFeedbackStyle.Heavy;
    void ExpoHaptics.impactAsync(style);
  };

  return { trigger };
}
