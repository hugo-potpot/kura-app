import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser, patientsPg, planningEntriesPg } from '@kura/db';
import { generateId } from '@kura/shared';

type RouteParams = { params: Promise<{ idelId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string; role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  const { idelId } = await params;

  // Vérifier que l'IDEL appartient à la même structure
  const idelRows = await db
    .select({ id: authUser.id, name: authUser.name, structureId: authUser.structureId, role: authUser.role })
    .from(authUser)
    .where(and(eq(authUser.id, idelId), eq(authUser.structureId, user.structureId)))
    .orderBy(authUser.id);

  if (idelRows.length === 0) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }
  const idel = idelRows[0]!;

  // Patients assignés à cet IDEL
  const patients = await db
    .select({
      id: patientsPg.id,
      firstName: patientsPg.firstName,
      lastName: patientsPg.lastName,
      address: patientsPg.address,
      assignedIdelId: patientsPg.assignedIdelId,
    })
    .from(patientsPg)
    .where(and(eq(patientsPg.assignedIdelId, idelId), eq(patientsPg.status, 'active')))
    .orderBy(patientsPg.lastName);

  // Planning pour la date demandée (query param ?date=YYYY-MM-DD, fallback = aujourd'hui)
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const today = new Date().toISOString().slice(0, 10);
  const date = dateParam !== null && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const planning = await db
    .select({
      id: planningEntriesPg.id,
      patientId: planningEntriesPg.patientId,
      idelId: planningEntriesPg.idelId,
      date: planningEntriesPg.date,
      orderIndex: planningEntriesPg.orderIndex,
      status: planningEntriesPg.status,
    })
    .from(planningEntriesPg)
    .where(and(eq(planningEntriesPg.idelId, idelId), eq(planningEntriesPg.date, date)))
    .orderBy(planningEntriesPg.orderIndex);

  return NextResponse.json({ data: { idel, patients, planning, today: date } }, { status: 200 });
}

const PutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date YYYY-MM-DD requis'),
  entries: z.array(
    z.object({
      patientId: z.string().min(1),
      orderIndex: z.number().int().min(0),
    }),
  ),
});

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string; role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  const { idelId } = await params;

  // Vérifier que l'IDEL appartient à la même structure
  const idelRows = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(and(eq(authUser.id, idelId), eq(authUser.structureId, user.structureId)))
    .orderBy(authUser.id);

  if (idelRows.length === 0) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  const { date, entries } = parsed.data;

  // Supprimer les entrées existantes pour cet IDEL à cette date, puis réinsérer
  await db
    .delete(planningEntriesPg)
    .where(and(eq(planningEntriesPg.idelId, idelId), eq(planningEntriesPg.date, date)));

  if (entries.length > 0) {
    const now = new Date();
    await db.insert(planningEntriesPg).values(
      entries.map((e) => ({
        id: generateId(),
        patientId: e.patientId,
        idelId,
        date,
        orderIndex: e.orderIndex,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  // Stub FCM — la notification sera envoyée via Firebase dans une future story
  console.log(`[FCM-stub] Planning modifié par admin pour IDEL ${idelId} le ${date} — notifier mobile`);

  return NextResponse.json({ data: { saved: entries.length } }, { status: 200 });
}
