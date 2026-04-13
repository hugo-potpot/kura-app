import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser, authSession, auditLogsPg } from '@kura/db';
import { generateId } from '@kura/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  const { userId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id: string; role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin avec une structure requis' } },
      { status: 403 },
    );
  }

  const [target] = await db
    .select()
    .from(authUser)
    .where(and(eq(authUser.id, userId), eq(authUser.structureId, user.structureId)))
    .limit(1);

  if (!target) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Membre introuvable dans cette structure' } },
      { status: 404 },
    );
  }

  if (target.disabled) {
    return NextResponse.json(
      { error: { code: 'ALREADY_DISABLED', message: 'Ce compte est déjà désactivé' } },
      { status: 409 },
    );
  }

  // Protection anti-verrouillage (AC3) — vérifier les admins actifs restants
  if (target.role === 'admin') {
    const [result] = await db
      .select({ count: count() })
      .from(authUser)
      .where(
        and(
          eq(authUser.structureId, user.structureId),
          eq(authUser.role, 'admin'),
          eq(authUser.disabled, false),
        ),
      );

    if ((result?.count ?? 0) <= 1) {
      return NextResponse.json(
        { error: { code: 'LAST_ADMIN_PROTECTION', message: "Impossible — vous êtes le seul admin de cette structure" } },
        { status: 409 },
      );
    }
  }

  // Désactiver le compte
  await db.update(authUser).set({ disabled: true }).where(eq(authUser.id, userId));

  // Révoquer toutes les sessions actives
  const deleted = await db
    .delete(authSession)
    .where(eq(authSession.userId, userId))
    .returning();

  // Log d'audit
  await db.insert(auditLogsPg).values({
    id: generateId(),
    userId: user.id,
    action: 'ACCOUNT_DISABLED',
    resourceType: 'user',
    resourceId: userId,
    ipAddress: request.headers.get('x-forwarded-for') ?? null,
    timestamp: new Date(),
    metadata: JSON.stringify({ sessionsRevoked: deleted.length }),
  });

  return NextResponse.json(
    { data: { disabled: true, sessionsRevoked: deleted.length } },
    { status: 200 },
  );
}
