import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invitationsPg, authUser } from '@kura/db';

const AcceptSchema = z.object({
  token: z.string().min(1, 'Token requis'),
});

// GET /api/v1/invitations/accept?token=xxx — PUBLIC : valider un token sans auth (T5)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { data: { valid: false, reason: 'NOT_FOUND' } },
      { status: 200 },
    );
  }

  const [invitation] = await db
    .select()
    .from(invitationsPg)
    .where(eq(invitationsPg.token, token))
    .limit(1);

  if (!invitation) {
    return NextResponse.json(
      { data: { valid: false, reason: 'NOT_FOUND' } },
      { status: 200 },
    );
  }

  if (invitation.status === 'accepted') {
    return NextResponse.json(
      { data: { valid: false, reason: 'ALREADY_USED' } },
      { status: 200 },
    );
  }

  const now = new Date();
  if (invitation.status === 'expired' || invitation.expiresAt < now) {
    return NextResponse.json(
      { data: { valid: false, reason: 'EXPIRED' } },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      data: {
        valid: true,
        role: invitation.role,
        structureId: invitation.structureId,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    },
    { status: 200 },
  );
}

// POST /api/v1/invitations/accept — Authentifié : accepter l'invitation (T4)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
      { status: 401 },
    );
  }

  const body = await request.json() as unknown;
  const parsed = AcceptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  const [invitation] = await db
    .select()
    .from(invitationsPg)
    .where(eq(invitationsPg.token, parsed.data.token))
    .limit(1);

  if (!invitation) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Invitation introuvable' } },
      { status: 404 },
    );
  }

  if (invitation.status === 'accepted') {
    return NextResponse.json(
      { error: { code: 'INVITATION_ALREADY_USED', message: "Cette invitation a déjà été acceptée" } },
      { status: 400 },
    );
  }

  const now = new Date();
  if (invitation.status === 'expired' || invitation.expiresAt < now) {
    return NextResponse.json(
      { error: { code: 'INVITATION_EXPIRED', message: "Cette invitation a expiré — contactez votre admin pour en recevoir une nouvelle" } },
      { status: 400 },
    );
  }

  if (invitation.email !== session.user.email) {
    return NextResponse.json(
      { error: { code: 'EMAIL_MISMATCH', message: "Ce lien d'invitation est destiné à une autre adresse email" } },
      { status: 403 },
    );
  }

  await db
    .update(authUser)
    .set({
      structureId: invitation.structureId,
      role: invitation.role,
    })
    .where(eq(authUser.id, session.user.id));

  await db
    .update(invitationsPg)
    .set({ status: 'accepted' })
    .where(eq(invitationsPg.id, invitation.id));

  return NextResponse.json(
    { data: { accepted: true, structureId: invitation.structureId } },
    { status: 200 },
  );
}
