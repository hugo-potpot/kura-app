import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Profil</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Profil utilisateur — à implémenter (Story 2.5)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholder: { opacity: 0.5, marginTop: 8 },
});
