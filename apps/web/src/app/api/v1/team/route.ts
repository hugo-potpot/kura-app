import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser } from '@kura/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id: string; structureId?: string | null; role?: string } | undefined;

  if (!session || !user?.structureId) {
    return NextResponse.json(
      { error: { code: 'NO_STRUCTURE', message: 'Structure requise' } },
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
    })
    .from(authUser)
    .where(eq(authUser.structureId, user.structureId));

  const enriched = members.map((m) => ({ ...m, isSelf: m.id === user.id }));

  return NextResponse.json({ data: { members: enriched } }, { status: 200 });
}
