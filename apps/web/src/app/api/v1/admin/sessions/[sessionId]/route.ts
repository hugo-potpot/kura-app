import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authSession } from '@kura/db';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Accès administrateur requis' } },
      { status: 403 },
    );
  }

  const { sessionId } = await params;

  const deleted = await db
    .delete(authSession)
    .where(eq(authSession.id, sessionId))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Session introuvable' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: { revoked: true, sessionId } });
}
