import { useMutation } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { patients, syncQueue } from '@kura/db';
import { generateId } from '@kura/shared';
import { getDb } from '@/lib/db';
import { geocodeAddress } from '@/lib/geocoding';

export interface CreatePatientInput {
  structureId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone?: string;
  treatingDoctor?: string;
  latitude?: number;
  longitude?: number;
}

async function createPatient(input: CreatePatientInput): Promise<typeof patients.$inferSelect> {
  const db = await getDb();
  const now = new Date();
  const patientId = generateId();

  const inserted = await db
    .insert(patients)
    .values({
      id: patientId,
      structureId: input.structureId,
      firstName: input.firstName,
      lastName: input.lastName,
      address: input.address,
      phone: input.phone ?? null,
      treatingDoctor: input.treatingDoctor ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const patient = inserted[0];
  if (!patient) throw new Error('Échec de la création du patient');

  // Sync queue entry for future server synchronization
  await db.insert(syncQueue).values({
    id: generateId(),
    entityType: 'patient',
    entityId: patientId,
    operation: 'CREATE',
    payload: JSON.stringify({
      structureId: input.structureId,
      firstName: input.firstName,
      lastName: input.lastName,
      address: input.address,
      phone: input.phone ?? null,
      treatingDoctor: input.treatingDoctor ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    }),
    retryCount: 0,
    createdAt: now,
  });

  // Non-blocking geocoding — only if coords were not already provided
  if (!input.latitude || !input.longitude) {
    void (async () => {
      const coords = await geocodeAddress(input.address);
      if (!coords) return;
      const geoDb = await getDb();
      await geoDb
        .update(patients)
        .set({ latitude: coords.lat, longitude: coords.lng })
        .where(eq(patients.id, patientId));
    })();
  }

  return patient;
}

export function useCreatePatient() {
  return useMutation({
    mutationFn: createPatient,
  });
}
