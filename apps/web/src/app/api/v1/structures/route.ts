import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { structuresPg, authUser } from '@kura/db';
import { generateId } from '@kura/shared';

const StructureSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
      { status: 401 },
    );
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: "Réservé aux administrateurs" } },
      { status: 403 },
    );
  }

  const body = await request.json() as unknown;
  const parsed = StructureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  // Vérification SIRET doublon (soft warning, pas blocage — AC3)
  let warning: string | undefined;
  if (parsed.data.siret) {
    const existing = await db
      .select({ id: structuresPg.id })
      .from(structuresPg)
      .where(eq(structuresPg.siret, parsed.data.siret))
      .limit(1);
    if (existing.length > 0) warning = 'SIRET_EXISTS';
  }

  const inserted = await db
    .insert(structuresPg)
    .values({
      id: generateId(),
      name: parsed.data.name,
      address: parsed.data.address,
      siret: parsed.data.siret ?? null,
      createdAt: new Date(),
    })
    .returning();

  const structure = inserted[0];
  if (!structure) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la création de la structure' } },
      { status: 500 },
    );
  }

  // Mise à jour structureId de l'utilisateur (Drizzle direct sur authUser — AC1)
  await db
    .update(authUser)
    .set({ structureId: structure.id })
    .where(eq(authUser.id, session.user.id));

  return NextResponse.json({ data: { structure, warning } }, { status: 201 });
}
