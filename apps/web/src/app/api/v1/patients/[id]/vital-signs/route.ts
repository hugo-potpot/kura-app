import { NextResponse } from 'next/server';
import { eq, and, gte } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, vitalSignsPg } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

const RANGE_MS: Record<string, number> = {
  '7d':  7  * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '6m':  6  * 30 * 24 * 60 * 60 * 1000,
};

export async function GET(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id?: string; structureId?: string | null; role?: string };
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const { id } = await params;
  const range = new URL(req.url).searchParams.get('range') ?? '30d';
  const ms = RANGE_MS[range] ?? 30 * 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - ms);

  const [patient] = await db
    .select({ id: patientsPg.id })
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  const signs = await db
    .select()
    .from(vitalSignsPg)
    .where(and(eq(vitalSignsPg.patientId, id), gte(vitalSignsPg.measuredAt, since)))
    .orderBy(vitalSignsPg.measuredAt);

  return NextResponse.json({ data: { vitalSigns: signs } });
}
