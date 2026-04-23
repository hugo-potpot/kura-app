import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg } from '@kura/db';
import { generateId } from '@kura/shared';
import { geocodeAddress } from '@/lib/geocoding';

const CreatePatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address: z.string().min(5).max(300),
  phone: z.string().optional(),
  treatingDoctor: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

async function geocodeAndUpdate(patientId: string, address: string): Promise<void> {
  const coords = await geocodeAddress(address);
  if (!coords) return;
  await db
    .update(patientsPg)
    .set({ latitude: coords.lat, longitude: coords.lng })
    .where(eq(patientsPg.id, patientId));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string; role?: string; structureId?: string | null } | undefined;

  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  if (user?.role === 'doctor') {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }
  if (!user?.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = CreatePatientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  const now = new Date();
  const patientId = generateId();

  const hasCoords = parsed.data.latitude !== undefined && parsed.data.longitude !== undefined;

  const inserted = await db
    .insert(patientsPg)
    .values({
      id: patientId,
      structureId: user.structureId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      address: parsed.data.address,
      phone: parsed.data.phone ?? null,
      treatingDoctor: parsed.data.treatingDoctor ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const patient = inserted[0];
  if (!patient) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }

  // Géocodage non-bloquant uniquement si les coordonnées ne sont pas déjà fournies
  if (!hasCoords) {
    void geocodeAndUpdate(patientId, parsed.data.address);
  }

  return NextResponse.json({ data: { patient } }, { status: 201 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string; role?: string; structureId?: string | null } | undefined;

  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  if (!user?.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'active' | 'archived' | null;
  const search = searchParams.get('search');

  // Niveau 1 : isolation par structure (tous les rôles)
  const conditions = [eq(patientsPg.structureId, user.structureId)];

  // Niveau 2 : isolation par IDEL assigné (rôle idel uniquement)
  if (user.role === 'idel' && user.id) {
    conditions.push(eq(patientsPg.assignedIdelId, user.id));
  }

  if (status === 'active' || status === 'archived') {
    conditions.push(eq(patientsPg.status, status));
  }

  if (search && search.trim().length >= 2) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(patientsPg.firstName, term),
        ilike(patientsPg.lastName, term),
        ilike(patientsPg.address, term),
        ilike(patientsPg.treatingDoctor, term),
      )!,
    );
  }

  const patients = await db
    .select()
    .from(patientsPg)
    .where(and(...conditions))
    .orderBy(desc(patientsPg.updatedAt));

  return NextResponse.json({ data: { patients } }, { status: 200 });
}