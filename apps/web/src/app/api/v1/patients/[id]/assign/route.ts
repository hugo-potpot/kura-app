import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, authUser } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

const AssignSchema = z.object({
  idelId: z.string().nullable(),
});

export async function PATCH(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id: string; structureId?: string | null; role?: string };
  if (user.role !== 'admin') {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'INVALID_BODY' } }, { status: 400 });
  }

  const { idelId } = parsed.data;

  if (idelId !== null) {
    const [targetIdel] = await db
      .select({ id: authUser.id })
      .from(authUser)
      .where(and(
        eq(authUser.id, idelId),
        eq(authUser.structureId, user.structureId),
        eq(authUser.role, 'idel'),
      ));
    if (!targetIdel) {
      return NextResponse.json({ error: { code: 'IDEL_NOT_FOUND' } }, { status: 404 });
    }
  }

  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));
  if (!patient) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  await db
    .update(patientsPg)
    .set({
      assignedIdelId: idelId,
      updatedAt: new Date(),
      // TODO: Story 7.1 — envoyer notification push à l'IDEL lors de l'assignation
      ...(idelId === null ? { syncedAt: null } : {}),
    })
    .where(eq(patientsPg.id, id));

  const [updated] = await db
    .select()
    .from(patientsPg)
    .where(eq(patientsPg.id, id));

  return NextResponse.json({ data: { patient: updated } });
}
