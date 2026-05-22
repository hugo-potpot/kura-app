import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, transmissionsPg } from '@kura/db';
import { authUser } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id?: string; structureId?: string | null };
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { id } = await params;

  const [patient] = await db
    .select({ id: patientsPg.id })
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  const rows = await db
    .select({
      id: transmissionsPg.id,
      patientId: transmissionsPg.patientId,
      authorId: transmissionsPg.authorId,
      authorName: authUser.name,
      contentValidated: transmissionsPg.contentValidated,
      careType: transmissionsPg.careType,
      createdAt: transmissionsPg.createdAt,
      syncedAt: transmissionsPg.syncedAt,
    })
    .from(transmissionsPg)
    .leftJoin(authUser, eq(transmissionsPg.authorId, authUser.id))
    .where(eq(transmissionsPg.patientId, id))
    .orderBy(desc(transmissionsPg.createdAt));

  return NextResponse.json({ data: { transmissions: rows } });
}
