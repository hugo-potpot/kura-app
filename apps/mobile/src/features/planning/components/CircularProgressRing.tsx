import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from 'react-native-paper';

import { COLORS } from '@/theme/kura-theme';

const SIZE = 52;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const CIRC = 2 * Math.PI * R;

interface CircularProgressRingProps {
  completed: number;
  total: number;
  accessibilityLabel: string;
}

/**
 * C2 — progression visites complétées / total pour la journée.
 */
export function CircularProgressRing({
  completed,
  total,
  accessibilityLabel,
}: CircularProgressRingProps): React.JSX.Element {
  const ratio = total <= 0 ? 0 : Math.min(1, Math.max(0, completed / total));
  const dashOffset = CIRC * (1 - ratio);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            stroke={COLORS.tealAccent}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View style={styles.centerText} pointerEvents="none">
        <Text style={styles.ratioText} maxFontSizeMultiplier={1.5}>
          {completed}/{total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratioText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
