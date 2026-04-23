import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { Patient } from '@kura/shared';
import { HighlightText } from './HighlightText';

interface Props {
  patient: Patient;
  searchTerm: string;
  onPress: () => void;
}

function Initials({ name }: { name: string }): React.JSX.Element {
  const parts = name.trim().split(' ').filter(Boolean);
  const letters = parts.length >= 2
    ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`
    : name.slice(0, 2);
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{letters.toUpperCase()}</Text>
    </View>
  );
}

export function PatientCard({ patient, searchTerm, onPress }: Props): React.JSX.Element {
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const isArchived = patient.status === 'archived';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le dossier de ${fullName}`}
    >
      <Initials name={fullName} />
      <View style={styles.info}>
        <HighlightText
          text={fullName}
          highlight={searchTerm}
          style={styles.name}
        />
        {patient.treatingDoctor ? (
          <HighlightText
            text={patient.treatingDoctor}
            highlight={searchTerm}
            style={styles.doctor}
          />
        ) : null}
        {patient.address ? (
          <HighlightText
            text={patient.address}
            highlight={searchTerm}
            style={styles.address}
            numberOfLines={1}
          />
        ) : null}
      </View>
      {isArchived && (
        <View style={styles.archivedBadge}>
          <Text style={styles.archivedText}>Archivé</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3730a3',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  doctor: {
    fontSize: 13,
    color: '#64748b',
  },
  address: {
    fontSize: 12,
    color: '#94a3b8',
  },
  archivedBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  archivedText: {
    fontSize: 11,
    color: '#c2410c',
    fontWeight: '600',
  },
});
