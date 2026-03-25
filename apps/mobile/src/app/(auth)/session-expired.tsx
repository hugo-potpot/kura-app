import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function SessionExpiredScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title} accessibilityRole="header">
          Session expirée
        </Text>

        <View accessible accessibilityRole="alert" style={styles.messageContainer}>
          <Text variant="bodyMedium" style={styles.message}>
            Connexion internet requise pour renouveler votre session. Veuillez vous connecter à
            internet et réessayer.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={() => router.replace('/(app)/planning/index')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Réessayer la connexion"
        >
          Réessayer
        </Button>

        <Button
          mode="text"
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
    gap: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  messageContainer: {
    marginVertical: 8,
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    marginTop: 4,
  },
  buttonContent: {
    minHeight: 48,
  },
});