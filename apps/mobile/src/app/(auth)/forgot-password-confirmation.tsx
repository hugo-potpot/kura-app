import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function ForgotPasswordConfirmationScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text
        variant="bodyLarge"
        style={styles.message}
        accessible
        accessibilityRole="alert"
      >
        Si cet email est enregistré, un lien de réinitialisation vous a été envoyé. Vérifiez votre
        boîte mail.
      </Text>

      <Button
        mode="contained"
        onPress={() => router.replace('/(auth)/login')}
        style={styles.button}
        contentStyle={styles.buttonContent}
        accessibilityLabel="Retour à la connexion"
      >
        Retour à la connexion
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    alignSelf: 'stretch',
  },
  buttonContent: {
    minHeight: 48,
  },
});
