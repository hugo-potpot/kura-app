import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function PatientsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Patients</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Liste des patients — à implémenter (Story 3.4)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholder: { opacity: 0.5, marginTop: 8 },
});
