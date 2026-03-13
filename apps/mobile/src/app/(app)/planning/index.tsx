import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function PlanningScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Planning du jour</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Écran de planning — à implémenter (Story 4.1)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholder: { opacity: 0.5, marginTop: 8 },
});
