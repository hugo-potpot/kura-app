import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { geocodeAndUpdate } from '@/lib/geocoding';
import { patientsPg, transmissionsPg, auditLogsPg } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

const UpdatePatientSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  address: z.string().min(5).max(300).optional(),
  phone: z.string().optional().nullable(),
  treatingDoctor: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni',
});

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id?: string; structureId?: string | null; role?: string };
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { id } = await params;
  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  // Niveau 2 : un IDEL ne peut accéder qu'aux patients qui lui sont assignés
  if (user.role === 'idel' && patient.assignedIdelId !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  return NextResponse.json({ data: { patient } });
}

export async function PATCH(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { structureId?: string | null; role?: string };
  if (user.role === 'doctor') {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = UpdatePatientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!existing) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  const addressChanged = parsed.data.address !== undefined && parsed.data.address !== existing.address;
  const hasCoords = parsed.data.latitude !== undefined && parsed.data.latitude !== null
    && parsed.data.longitude !== undefined && parsed.data.longitude !== null;

  await db
    .update(patientsPg)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(patientsPg.id, id));

  if (addressChanged && !hasCoords) {
    void geocodeAndUpdate(id, parsed.data.address!);
  }

  const [updated] = await db
    .select()
    .from(patientsPg)
    .where(eq(patientsPg.id, id));

  return NextResponse.json({ data: { patient: updated } });
}

export async function DELETE(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id: string; structureId?: string | null; role?: string };
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { id } = await params;
  const force = new URL(req.url).searchParams.get('force') === 'true';

  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  if (user.role === 'idel' && patient.assignedIdelId !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  // Vérification rétention 10 ans (sauf ?force=true)
  if (!force) {
    const tenYearsAgo = new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000);
    const [recentTx] = await db
      .select({ id: transmissionsPg.id })
      .from(transmissionsPg)
      .where(and(eq(transmissionsPg.patientId, id), gt(transmissionsPg.createdAt, tenYearsAgo)))
      .limit(1);

    if (recentTx) {
      return NextResponse.json(
        { error: { code: 'RETENTION_WARNING', message: 'Ce patient a des transmissions de moins de 10 ans' } },
        { status: 409 },
      );
    }
  }

  // Audit log AVANT suppression (traçabilité RGPD irréversible)
  await db.insert(auditLogsPg).values({
    userId: user.id,
    action: 'PATIENT_DELETED',
    resourceType: 'patient',
    resourceId: id,
    timestamp: new Date(),
    metadata: JSON.stringify({
      patientName: `${patient.firstName} ${patient.lastName}`,
      structureId: user.structureId,
      forcedDeletion: force,
    }),
  });

  await db.delete(transmissionsPg).where(eq(transmissionsPg.patientId, id));
  await db.delete(patientsPg).where(eq(patientsPg.id, id));

  return new Response(null, { status: 204 });
}
