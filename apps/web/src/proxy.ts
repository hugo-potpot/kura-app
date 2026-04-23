import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

// Routes publiques — pas de guard
const PUBLIC_PATHS = [
  '/api/auth',
  '/(auth)/login',
  '/login',
  '/reset-password',
  '/forgot-password',
  '/onboarding', // accessible après auth, sans structure (story 2.1)
  '/accept-invitation', // page publique d'acceptation d'invitation (story 2.2)
  '/api/v1/invitations/accept', // GET validate token public, POST nécessite auth (story 2.2)
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Vérifier la session BetterAuth
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch {
    // DB timeout ou erreur réseau — traiter comme non authentifié
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    if (!pathname.startsWith('/api/')) {
      loginUrl.searchParams.set('error', 'session_expired');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Admin sans structure → onboarding obligatoire (AC4, story 2.1)
  // Exclure les routes API pour éviter de bloquer les appels POST /api/v1/structures
  const userWithStructure = session.user as { structureId?: string | null; role?: string | null; disabled?: boolean | null };

  // Guard compte désactivé (AC2 — story 2.4)
  if (userWithStructure.disabled) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'ACCOUNT_DISABLED', message: 'Votre compte a été désactivé — contactez votre admin' } },
        { status: 401 },
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'account_disabled');
    return NextResponse.redirect(loginUrl);
  }

  // Admin sans structure → onboarding obligatoire (AC4, story 2.1)
  // Exclure les routes API pour éviter de bloquer les appels POST /api/v1/structures
  if (!userWithStructure.structureId && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Guard lecture seule pour les médecins prescripteurs (AC3 — story 2.3)
  const DOCTOR_MUTATION_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];
  const DOCTOR_MUTATION_EXCEPTIONS = ['/api/v1/invitations/accept'];
  if (
    userWithStructure.role === 'doctor' &&
    DOCTOR_MUTATION_METHODS.includes(request.method) &&
    !DOCTOR_MUTATION_EXCEPTIONS.some((exc) => pathname.startsWith(exc))
  ) {
    return NextResponse.json(
      { error: { code: 'READ_ONLY_ROLE', message: 'Les médecins prescripteurs ont un accès lecture seule' } },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
