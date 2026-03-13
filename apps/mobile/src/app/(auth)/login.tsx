import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>KURA</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Votre assistant infirmier intelligent
      </Text>
      <Button
        mode="contained"
        onPress={() => router.replace('/(app)/planning')}
        style={styles.button}
      >
        Se connecter
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
    width: '100%',
  },
});
