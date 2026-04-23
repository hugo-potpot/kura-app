import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/kura-theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_CONFIG: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  'planning/index': {
    label: 'Planning',
    icon: 'calendar-month-outline',
    iconActive: 'calendar-month',
  },
  'patients/index': {
    label: 'Patients',
    icon: 'account-group-outline',
    iconActive: 'account-group',
  },
  'transmissions/index': {
    label: 'Transmissions',
    icon: 'clipboard-text-outline',
    iconActive: 'clipboard-text',
  },
  'profile/index': {
    label: 'Profil',
    icon: 'account-circle-outline',
    iconActive: 'account-circle',
  },
};

export function BottomTabBar({ state, navigation }: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => TAB_CONFIG[r.name]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={config.label}
            accessibilityState={{ selected: isFocused }}
          >
            <View style={[styles.tabInner, isFocused && styles.tabInnerActive]}>
              <MaterialCommunityIcons
                name={isFocused ? config.iconActive : config.icon}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {config.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.navBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 3,
  },
  tabInnerActive: {
    backgroundColor: COLORS.activeTabBg,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
