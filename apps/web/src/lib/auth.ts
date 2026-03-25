import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { db } from './db';
import { authUser, authSession, authAccount, authVerification, authTwoFactor } from '@kura/db';

// Story 1.2 — MFA activé via plugin twoFactor (TOTP)
// Note: passkey plugin absent en better-auth v1.5.5 — biométrie gérée côté mobile (expo-local-authentication)
// Note: requireTwoFactorSetup non disponible comme option plugin — enforcement via middleware Next.js
export const auth = betterAuth({
  baseURL: process.env['BETTER_AUTH_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
      twoFactor: authTwoFactor,
    },
  }),
  user: {
    additionalFields: {
      structureId: {
        type: 'string',
        required: false,
        input: true,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'idel',
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    twoFactor({
      issuer: 'KURA',
      totpOptions: { digits: 6, period: 30 },
    }),
  ],
  trustedOrigins: [
    process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000',
    'http://localhost:8081',
    'exp://localhost:8081',
  ],
  advanced: {
    disableCSRFCheck: true,
  },
});
