import { useQuery } from '@tanstack/react-query';

import { patients } from '@kura/db';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export type Patient = typeof patients.$inferSelect;

async function fetchPatient(id: string): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id));
  return result[0] ?? null;
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchPatient(id),
    enabled: !!id,
  });
}
