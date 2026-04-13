import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser, auditLogsPg } from '@kura/db';
import { generateId } from '@kura/shared';

const PatchMemberSchema = z.object({
  role: z.enum(['idel', 'doctor']),
});

export async function PATCH(
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

  const body = await request.json() as unknown;
  const parsed = PatchMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } },
      { status: 400 },
    );
  }

  // Protection anti-verrouillage (AC3) : dernier admin ne peut pas perdre son rôle admin
  if (target.id === user.id) {
    const [result] = await db
      .select({ count: count() })
      .from(authUser)
      .where(and(eq(authUser.structureId, user.structureId), eq(authUser.role, 'admin')));

    if ((result?.count ?? 0) <= 1) {
      return NextResponse.json(
        { error: { code: 'LAST_ADMIN_PROTECTION', message: "Impossible — vous êtes le seul admin de cette structure" } },
        { status: 409 },
      );
    }
  }

  const previousRole = target.role;
  await db.update(authUser).set({ role: parsed.data.role }).where(eq(authUser.id, userId));

  await db.insert(auditLogsPg).values({
    id: generateId(),
    userId: user.id,
    action: 'ROLE_CHANGE',
    resourceType: 'user',
    resourceId: userId,
    ipAddress: request.headers.get('x-forwarded-for') ?? null,
    timestamp: new Date(),
    metadata: JSON.stringify({ previousRole, newRole: parsed.data.role }),
  });

  return NextResponse.json(
    { data: { member: { id: userId, role: parsed.data.role } } },
    { status: 200 },
  );
}
