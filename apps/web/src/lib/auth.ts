import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

/**
 * Configuration BetterAuth de base pour le prototype (Story 1.1).
 * Les plugins MFA (twoFactor/TOTP) et WebAuthn (passkey) seront ajoutés
 * lors des stories 1.2 et 9.4.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000',
  ],
});
