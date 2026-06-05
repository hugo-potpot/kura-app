import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { patients, syncQueue } from '@kura/db';
import { generateId } from '@kura/shared';
import { getDb } from '@/lib/db';

export interface UpdatePatientInput {
  id: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string | null;
  treatingDoctor?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

async function updatePatient(input: UpdatePatientInput): Promise<typeof patients.$inferSelect> {
  const db = await getDb();
  const { id, ...updates } = input;
  const now = new Date();

  await db
    .update(patients)
    .set({ ...updates, updatedAt: now })
    .where(eq(patients.id, id));

  await db.insert(syncQueue).values({
    id: generateId(),
    entityType: 'patient',
    entityId: id,
    operation: 'UPDATE',
    payload: JSON.stringify(updates),
    retryCount: 0,
    createdAt: now,
  });

  const result = await db.select().from(patients).where(eq(patients.id, id));
  const updated = result[0];
  if (!updated) throw new Error('Patient introuvable après mise à jour');
  return updated;
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePatient,
    onSuccess: (patient) => {
      void queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
