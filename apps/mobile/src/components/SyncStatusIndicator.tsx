import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { COLORS } from '@/theme/kura-theme';

export type SyncStatusIndicatorVariant = 'synced' | 'pending';

interface SyncStatusIndicatorProps {
  variant: SyncStatusIndicatorVariant;
}

/**
 * C5 minimal — états synced / pending pour données locales (pas de sheet détail dans cette story).
 */
export function SyncStatusIndicator({ variant }: SyncStatusIndicatorProps): React.JSX.Element {
  const isPending = variant === 'pending';
  const icon = isPending ? 'cloud-alert-outline' : 'cloud-check-outline';
  const label = isPending ? 'Données locales non synchronisées' : 'Données synchronisées';
  const color = isPending ? '#FFB020' : COLORS.tealAccent;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.caption, { color }]} maxFontSizeMultiplier={1.5}>
        {isPending ? 'Sync' : 'OK'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 2,
    minWidth: 44,
  },
  caption: {
    fontSize: 10,
    fontWeight: '700',
  },
});
