import { NextResponse } from 'next/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { transmissionsPg, patientsPg } from '@kura/db';

/**
 * Liste les transmissions de la structure de l'utilisateur (descente serveur → mobile).
 * Bornée aux patients de la structure (isolation multi-tenant).
 */
export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id?: string; structureId?: string | null };
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const rows = await db
    .select({
      id: transmissionsPg.id,
      patientId: transmissionsPg.patientId,
      authorId: transmissionsPg.authorId,
      contentOriginal: transmissionsPg.contentOriginal,
      contentValidated: transmissionsPg.contentValidated,
      careType: transmissionsPg.careType,
      createdAt: transmissionsPg.createdAt,
      updatedAt: transmissionsPg.updatedAt,
    })
    .from(transmissionsPg)
    .innerJoin(patientsPg, eq(transmissionsPg.patientId, patientsPg.id))
    .where(eq(patientsPg.structureId, user.structureId))
    .orderBy(desc(transmissionsPg.createdAt))
    .limit(500);

  return NextResponse.json({ data: { transmissions: rows } });
}

const transmissionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  authorId: z.string(),
  contentOriginal: z.string().nullable(),
  contentValidated: z.string(),
  careType: z.enum(['toilette', 'pansement', 'injection', 'constantes', 'autre']),
  createdAt: z.string().or(z.number()),
  updatedAt: z.string().or(z.number()),
});

const bodySchema = z.object({
  transmissions: z.array(transmissionSchema).min(1).max(200),
});

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = session.user as { id?: string; structureId?: string | null };
  if (!user.structureId) {
    return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'INVALID_BODY', details: parsed.error.flatten() } }, { status: 400 });
  }

  const { transmissions } = parsed.data;

  // Vérifier que tous les patients appartiennent à la structure
  const patientIds = [...new Set(transmissions.map((t) => t.patientId))];
  const validPatients = await db
    .select({ id: patientsPg.id })
    .from(patientsPg)
    .where(inArray(patientsPg.id, patientIds));

  const validPatientIds = new Set(validPatients.map((p) => p.id));
  const filtered = transmissions.filter((t) => validPatientIds.has(t.patientId));

  if (filtered.length === 0) {
    return NextResponse.json({ data: { synced: 0 } });
  }

  const now = new Date();

  await db
    .insert(transmissionsPg)
    .values(
      filtered.map((t) => ({
        id: t.id,
        patientId: t.patientId,
        authorId: t.authorId,
        contentOriginal: t.contentOriginal,
        contentValidated: t.contentValidated,
        careType: t.careType,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        syncedAt: now,
      })),
    )
    .onConflictDoNothing({ target: transmissionsPg.id });

  return NextResponse.json({ data: { synced: filtered.length } });
}
