import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json() as { refreshToken?: string };

  if (!body.refreshToken) {
    return NextResponse.json(
      { error: { code: 'MISSING_REFRESH_TOKEN', message: 'Token manquant' } },
      { status: 400 }
    );
  }

  try {
    // Validate existing session token with BetterAuth
    const session = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${body.refreshToken}` }),
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: 'REFRESH_FAILED', message: 'Session expirée ou invalide' } },
        { status: 401 }
      );
    }

    // Session still valid — return same token (BetterAuth extends TTL via updateAge)
    return NextResponse.json({
      data: {
        token: body.refreshToken,
        refreshToken: body.refreshToken,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'REFRESH_FAILED', message: 'Session expirée ou invalide' } },
      { status: 401 }
    );
  }
}
