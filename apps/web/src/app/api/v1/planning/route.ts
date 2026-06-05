import { NextRequest, NextResponse } from 'next/server';
import { and, eq, asc, gte, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

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

const PatchSchema = z.object({
  entries: z.array(
    z
      .object({
        id: z.string().min(1),
        status: z.enum(['in_progress', 'done', 'skipped']).optional(),
        orderIndex: z.number().int().min(0).optional(),
        etaMinutes: z.number().int().nullable().optional(),
      })
      .refine(
        (e) => e.status !== undefined || e.orderIndex !== undefined || e.etaMinutes !== undefined,
        { message: 'Au moins un champ à mettre à jour (status, orderIndex ou etaMinutes)' },
      ),
  ).min(1),
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string } | undefined;

  if (!session || !user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const body = await request.json() as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  const { entries } = parsed.data;
  const ids = entries.map((e) => e.id);

  // Vérifier que toutes les entrées appartiennent à l'IDEL authentifié
  const existing = await db
    .select({ id: planningEntriesPg.id })
    .from(planningEntriesPg)
    .where(and(eq(planningEntriesPg.idelId, user.id), inArray(planningEntriesPg.id, ids)));

  const ownedIds = new Set(existing.map((r) => r.id));
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const entry of entries) {
      if (!ownedIds.has(entry.id)) continue;
      const set: Partial<typeof planningEntriesPg.$inferInsert> = { updatedAt: now };
      if (entry.status !== undefined) set.status = entry.status;
      if (entry.orderIndex !== undefined) set.orderIndex = entry.orderIndex;
      if (entry.etaMinutes !== undefined) set.etaMinutes = entry.etaMinutes;
      await tx
        .update(planningEntriesPg)
        .set(set)
        .where(eq(planningEntriesPg.id, entry.id));
    }
  });

  return NextResponse.json({ data: { updated: ownedIds.size } }, { status: 200 });
}

const PostSchema = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orderIndex: z.number().int().min(0),
});

/**
 * Crée une entrée de planning pour l'IDEL authentifié (ajout d'une urgence).
 * Le patient doit appartenir à la structure de l'utilisateur (isolation multi-tenant).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id?: string; structureId?: string | null } | undefined;

  if (!session || !user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const parsed = PostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }
  const { id, patientId, date, orderIndex } = parsed.data;

  const patient = (
    await db
      .select({ id: patientsPg.id })
      .from(patientsPg)
      .where(and(eq(patientsPg.id, patientId), eq(patientsPg.structureId, user.structureId)))
  )[0];
  if (!patient) {
    return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  }

  const now = new Date();
  const idelId = user.id;

  await db.transaction(async (tx) => {
    // Décale les visites existantes à partir de la position d'insertion pour
    // garder des order_index uniques et contigus (sinon doublon → heures identiques).
    await tx
      .update(planningEntriesPg)
      .set({ orderIndex: sql`${planningEntriesPg.orderIndex} + 1`, updatedAt: now })
      .where(
        and(
          eq(planningEntriesPg.idelId, idelId),
          eq(planningEntriesPg.date, date),
          gte(planningEntriesPg.orderIndex, orderIndex),
        ),
      );

    await tx
      .insert(planningEntriesPg)
      .values({
        id,
        patientId,
        idelId,
        date,
        orderIndex,
        status: 'pending',
        etaMinutes: null,
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
      })
      .onConflictDoNothing({ target: planningEntriesPg.id });
  });

  return NextResponse.json({ data: { id } }, { status: 201 });
}
