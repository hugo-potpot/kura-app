import { NextRequest, NextResponse } from 'next/server';
import { and, eq, asc } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, planningEntriesPg } from '@kura/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string; role?: string; structureId?: string | null } | undefined;

  if (!session || !user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  if (dateParam !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Format date invalide, attendu YYYY-MM-DD' } },
      { status: 400 },
    );
  }

  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const rows = await db
    .select({
      entry: {
        id: planningEntriesPg.id,
        patientId: planningEntriesPg.patientId,
        idelId: planningEntriesPg.idelId,
        date: planningEntriesPg.date,
        orderIndex: planningEntriesPg.orderIndex,
        status: planningEntriesPg.status,
        etaMinutes: planningEntriesPg.etaMinutes,
      },
      patient: {
        id: patientsPg.id,
        structureId: patientsPg.structureId,
        firstName: patientsPg.firstName,
        lastName: patientsPg.lastName,
        address: patientsPg.address,
        latitude: patientsPg.latitude,
        longitude: patientsPg.longitude,
      },
    })
    .from(planningEntriesPg)
    .innerJoin(patientsPg, eq(planningEntriesPg.patientId, patientsPg.id))
    .where(and(eq(planningEntriesPg.idelId, user.id), eq(planningEntriesPg.date, date)))
    .orderBy(asc(planningEntriesPg.orderIndex));

  const entries = rows.map((r) => ({
    id: r.entry.id,
    patientId: r.entry.patientId,
    orderIndex: r.entry.orderIndex,
    status: r.entry.status,
    etaMinutes: r.entry.etaMinutes,
    patient: {
      id: r.patient.id,
      structureId: r.patient.structureId ?? user.structureId ?? '',
      firstName: r.patient.firstName,
      lastName: r.patient.lastName,
      address: r.patient.address,
      latitude: r.patient.latitude,
      longitude: r.patient.longitude,
    },
  }));

  return NextResponse.json({ data: { date, entries } }, { status: 200 });
}
