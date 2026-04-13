import { Alert, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useLogout } from '@/features/auth/hooks/useLogout';

export default function ProfileScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const { logout, logoutAllDevices, isLoading } = useLogout();

  const handleLogoutAllDevices = (): void => {
    Alert.alert(
      'Déconnecter tous les appareils',
      "Tous vos appareils connectés seront déconnectés. Vous devrez vous reconnecter sur chacun d'eux.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: () => { void logoutAllDevices(); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête profil */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar} accessibilityRole="image" accessibilityLabel="Avatar utilisateur">
            <MaterialCommunityIcons name="account-circle" size={56} color="#3949AB" />
          </View>
          <View>
            <Text variant="titleMedium" style={styles.userName}>
              {user?.name ?? 'Utilisateur'}
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Section Sécurité */}
        <Text variant="labelLarge" style={styles.sectionTitle}>
          SÉCURITÉ
        </Text>

        <Button
          mode="outlined"
          onPress={() => { void logout(); }}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Se déconnecter de cet appareil"
          icon="logout"
        >
          Se déconnecter
        </Button>

        <Button
          mode="outlined"
          onPress={handleLogoutAllDevices}
          disabled={isLoading}
          style={[styles.button, styles.dangerButton]}
          contentStyle={styles.buttonContent}
          textColor="#E53935"
          accessibilityLabel="Déconnecter tous mes appareils"
          icon="devices"
        >
          Déconnecter tous mes appareils
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E8F0F8' },
  container: {
    flex: 1,
    padding: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C8DFF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  userEmail: {
    color: '#5C8DAA',
    marginTop: 2,
  },
  divider: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#5C8DAA',
    letterSpacing: 1,
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
    borderRadius: 10,
  },
  buttonContent: {
    minHeight: 48,
  },
  dangerButton: {
    borderColor: '#E53935',
  },
});
