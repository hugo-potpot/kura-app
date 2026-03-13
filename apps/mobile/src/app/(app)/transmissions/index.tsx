import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TransmissionsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Transmissions</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Transmissions médicales — à implémenter (Story 5.1)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholder: { opacity: 0.5, marginTop: 8 },
});
