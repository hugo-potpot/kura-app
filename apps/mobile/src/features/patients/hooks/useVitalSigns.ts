import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type VitalSignRange = '7d' | '30d' | '6m';

export interface VitalSign {
  id: string;
  patientId: string;
  authorId: string;
  measuredAt: Date;
  systolic: number | null;
  diastolic: number | null;
  glycemia: number | null;
  weight: number | null;
  temperature: number | null;
  spo2: number | null;
  createdAt: Date;
  syncedAt: Date | null;
}

interface VitalSignRaw {
  id: string;
  patientId: string;
  authorId: string;
  measuredAt: string;
  systolic: number | null;
  diastolic: number | null;
  glycemia: number | null;
  weight: number | null;
  temperature: number | null;
  spo2: number | null;
  createdAt: string;
  syncedAt: string | null;
}

async function fetchVitalSigns(patientId: string, range: VitalSignRange): Promise<VitalSign[]> {
  try {
    const res = await apiClient.get<{ data: { vitalSigns: VitalSignRaw[] } }>(
      `/api/v1/patients/${patientId}/vital-signs?range=${range}`,
    );
    return res.data.data.vitalSigns.map((vs) => ({
      ...vs,
      measuredAt: new Date(vs.measuredAt),
      createdAt: new Date(vs.createdAt),
      syncedAt: vs.syncedAt ? new Date(vs.syncedAt) : null,
    }));
  } catch {
    return [];
  }
}

export function useVitalSigns(patientId: string, range: VitalSignRange = '30d') {
  return useQuery({
    queryKey: ['vitalSigns', patientId, range],
    queryFn: () => fetchVitalSigns(patientId, range),
    enabled: !!patientId,
    staleTime: 30_000,
  });
}
