import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authSession } from '@kura/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Accès administrateur requis' } },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Paramètre userId requis' } },
      { status: 400 },
    );
  }

  const sessions = await db
    .select()
    .from(authSession)
    .where(eq(authSession.userId, userId));

  return NextResponse.json({ data: sessions });
}
