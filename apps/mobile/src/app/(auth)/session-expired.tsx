import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SessionExpiredScreen(): React.JSX.Element {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const isRevoked = reason === 'revoked';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <MaterialCommunityIcons
          name={isRevoked ? 'shield-remove' : 'clock-alert-outline'}
          size={56}
          color={isRevoked ? '#E53935' : '#F57C00'}
          style={styles.icon}
        />

        <Text variant="headlineSmall" style={styles.title} accessibilityRole="header">
          {isRevoked ? 'Accès révoqué' : 'Session expirée'}
        </Text>

        <View accessible accessibilityRole="alert" style={styles.messageContainer}>
          <Text variant="bodyMedium" style={styles.message}>
            {isRevoked
              ? "Votre accès a été révoqué sur cet appareil. Contactez votre administrateur si vous pensez que c'est une erreur."
              : "Votre session a expiré ou une connexion internet est requise pour renouveler votre accès."}
          </Text>
        </View>

        {!isRevoked && (
          <Button
            mode="contained"
            onPress={() => router.replace('/(app)/planning')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Réessayer la connexion"
          >
            Réessayer
          </Button>
        )}

        <Button
          mode={isRevoked ? 'contained' : 'text'}
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Se reconnecter avec email et mot de passe"
        >
          Se reconnecter
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    marginTop: 4,
    alignSelf: 'stretch',
  },
  buttonContent: {
    minHeight: 48,
  },
});
