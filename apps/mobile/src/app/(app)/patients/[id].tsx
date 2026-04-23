import { useLocalSearchParams } from 'expo-router';

import { PatientDetailScreen } from '@/features/patients/screens/PatientDetailScreen';

export default function PatientDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PatientDetailScreen patientId={id} />;
}
