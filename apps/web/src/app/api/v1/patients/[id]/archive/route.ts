import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, auditLogsPg } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id: string; structureId?: string | null; role?: string };
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

  if (user.role === 'idel' && patient.assignedIdelId !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  if (patient.status === 'archived') {
    return NextResponse.json({ error: { code: 'ALREADY_ARCHIVED' } }, { status: 409 });
  }

  await db
    .update(patientsPg)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(patientsPg.id, id));

  await db.insert(auditLogsPg).values({
    userId: user.id,
    action: 'PATIENT_ARCHIVED',
    resourceType: 'patient',
    resourceId: id,
    timestamp: new Date(),
    metadata: JSON.stringify({
      patientName: `${patient.firstName} ${patient.lastName}`,
      structureId: user.structureId,
    }),
  });

  const [updated] = await db.select().from(patientsPg).where(eq(patientsPg.id, id));
  return NextResponse.json({ data: { patient: updated } });
}
