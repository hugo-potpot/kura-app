import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invitationsPg } from '@kura/db';
import { generateId } from '@kura/shared';

const InviteSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['idel', 'doctor']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id: string; role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin avec une structure requis' } },
      { status: 403 },
    );
  }

  const body = await request.json() as unknown;
  const parsed = InviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  // Vérifier doublon pending (AC5)
  const existing = await db
    .select({ id: invitationsPg.id })
    .from(invitationsPg)
    .where(
      and(
        eq(invitationsPg.email, parsed.data.email),
        eq(invitationsPg.structureId, user.structureId),
        eq(invitationsPg.status, 'pending'),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: { code: 'INVITATION_ALREADY_PENDING', message: "Une invitation est déjà en attente pour cet email" } },
      { status: 409 },
    );
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const inserted = await db
    .insert(invitationsPg)
    .values({
      id: generateId(),
      email: parsed.data.email,
      role: parsed.data.role,
      structureId: user.structureId,
      invitedBy: user.id,
      token,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
    })
    .returning();

  const invitation = inserted[0];
  if (!invitation) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: "Erreur lors de la création de l'invitation" } },
      { status: 500 },
    );
  }

  const invitationUrl = `${process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3000'}/accept-invitation?token=${token}`;
  if (process.env['NODE_ENV'] !== 'production') {
    console.log(`[DEV] Lien d'invitation pour ${parsed.data.email} :\n${invitationUrl}`);
  }

  return NextResponse.json(
    {
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
      },
    },
    { status: 201 },
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin avec une structure requis' } },
      { status: 403 },
    );
  }

  const invitations = await db
    .select()
    .from(invitationsPg)
    .where(eq(invitationsPg.structureId, user.structureId));

  const now = new Date();
  const enriched = invitations.map((inv) => ({
    ...inv,
    status: inv.status === 'pending' && inv.expiresAt < now ? 'expired' : inv.status,
  }));

  return NextResponse.json({ data: { invitations: enriched } }, { status: 200 });
}
