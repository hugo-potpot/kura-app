import { Alert, ScrollView, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { COLORS } from '@/theme/kura-theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  danger,
  isLast,
}: {
  icon: IconName;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={danger ? COLORS.error : COLORS.primary}
        />
      </View>
      <View style={styles.rowLabel}>
        <Text style={[styles.rowLabelText, danger && styles.rowLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {!danger && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const { logout, logoutAllDevices, isLoading } = useLogout();
  const initials = getInitials(user?.name ?? 'U');

  const handleLogoutAllDevices = (): void => {
    Alert.alert(
      'Déconnecter tous les appareils',
      "Tous vos appareils connectés seront déconnectés.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: () => { void logoutAllDevices(); } },
      ],
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primaryDark }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Text style={styles.userName}>{user?.name ?? 'Utilisateur'}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="stethoscope" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.roleText}>Infirmier(e) libéral(e)</Text>
            </View>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="MON COMPTE">
          <SettingsRow
            icon="account-edit-outline"
            label="Informations personnelles"
            sublabel="Nom, téléphone"
            onPress={() => {}}
          />
          <SettingsRow
            icon="lock-outline"
            label="Modifier le mot de passe"
            isLast
            onPress={() => {}}
          />
        </SettingsGroup>

        <SettingsGroup title="SÉCURITÉ">
          <SettingsRow
            icon="fingerprint"
            label="Authentification biométrique"
            sublabel="Face ID / Touch ID"
            onPress={() => {}}
          />
          <SettingsRow
            icon="logout"
            label="Se déconnecter"
            onPress={() => { void logout(); }}
            danger
          />
          <SettingsRow
            icon="devices"
            label="Déconnecter tous mes appareils"
            onPress={handleLogoutAllDevices}
            danger
            isLast
          />
        </SettingsGroup>

        <SettingsGroup title="APPLICATION">
          <SettingsRow
            icon="bell-outline"
            label="Notifications"
            onPress={() => {}}
          />
          <SettingsRow
            icon="help-circle-outline"
            label="Aide & Support"
            isLast
            onPress={() => {}}
          />
        </SettingsGroup>

        <Text style={styles.version}>KURA · v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingBottom: 28 },
  headerContent: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 24, gap: 6 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },

  group: { marginBottom: 20 },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF2F7',
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: '#FEF2F2' },
  rowLabel: { flex: 1 },
  rowLabelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  rowLabelDanger: { color: COLORS.error },
  rowSublabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
