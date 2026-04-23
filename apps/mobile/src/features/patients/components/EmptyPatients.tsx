import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  isSearch: boolean;
  onClear: () => void;
}

export function EmptyPatients({ isSearch, onClear }: Props): React.JSX.Element {
  if (isSearch) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="magnify" size={48} color="#cbd5e1" />
        <Text style={styles.title}>Aucun patient trouvé</Text>
        <Text style={styles.subtitle}>Aucun résultat ne correspond à votre recherche.</Text>
        <Button mode="outlined" onPress={onClear} style={styles.button}>
          Effacer la recherche
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="account-group-outline" size={48} color="#cbd5e1" />
      <Text style={styles.title}>Aucun patient assigné</Text>
      <Text style={styles.subtitle}>Vous n&apos;avez pas encore de patients dans votre liste.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
  },
});
