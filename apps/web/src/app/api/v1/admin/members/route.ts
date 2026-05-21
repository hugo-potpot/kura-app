import { NextRequest, NextResponse } from 'next/server';
import { and, count, eq, inArray, max } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser, authSession, patientsPg } from '@kura/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id: string; role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin avec une structure requis' } },
      { status: 403 },
    );
  }

  const members = await db
    .select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      disabled: authUser.disabled,
      createdAt: authUser.createdAt,
    })
    .from(authUser)
    .where(eq(authUser.structureId, user.structureId))
    .orderBy(authUser.name);

  if (members.length === 0) {
    return NextResponse.json({ data: { members: [] } }, { status: 200 });
  }

  const memberIds = members.map((m) => m.id);

  // Dernière connexion par membre (max session.createdAt)
  const sessions = await db
    .select({ userId: authSession.userId, lastLoginAt: max(authSession.createdAt) })
    .from(authSession)
    .where(inArray(authSession.userId, memberIds))
    .groupBy(authSession.userId)
    .orderBy(authSession.userId);

  const lastLoginMap = new Map(sessions.map((s) => [s.userId, s.lastLoginAt]));

  // Nombre de patients actifs assignés par IDEL
  const patientCounts = await db
    .select({ assignedIdelId: patientsPg.assignedIdelId, count: count() })
    .from(patientsPg)
    .where(
      and(
        inArray(patientsPg.assignedIdelId, memberIds),
        eq(patientsPg.status, 'active'),
      ),
    )
    .groupBy(patientsPg.assignedIdelId)
    .orderBy(patientsPg.assignedIdelId);

  const patientCountMap = new Map(patientCounts.map((pc) => [pc.assignedIdelId, pc.count]));

  const enriched = members.map((m) => ({
    ...m,
    isSelf: m.id === user.id,
    patientCount: patientCountMap.get(m.id) ?? 0,
    lastLoginAt: lastLoginMap.get(m.id) ?? null,
  }));

  return NextResponse.json({ data: { members: enriched } }, { status: 200 });
}
