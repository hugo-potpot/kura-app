import { describe, it, expect, vi } from 'vitest';

// Mock betterAuth and all its dependencies before any imports
vi.mock('better-auth', () => ({
  betterAuth: vi.fn((config) => ({ options: config, _instance: true })),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({ type: 'drizzle-mock' })),
}));

vi.mock('better-auth/plugins/two-factor', () => ({
  twoFactor: vi.fn((opts) => ({ id: 'two-factor', ...opts })),
}));

vi.mock('./db', () => ({
  db: { mock: true },
}));

describe('auth configuration', () => {
  it('should have twoFactor plugin configured', async () => {
    const { auth } = await import('./auth');
    const plugins = (auth as unknown as { options: { plugins: Array<{ id: string }> } }).options?.plugins;
    const twoFactorPlugin = plugins?.find((p) => p.id === 'two-factor');
    expect(twoFactorPlugin).toBeDefined();
  });

  it('should have minPasswordLength set to 12', async () => {
    const { auth } = await import('./auth');
    const emailAndPassword = (auth as unknown as { options: { emailAndPassword: Record<string, unknown> } }).options?.emailAndPassword;
    expect(emailAndPassword?.minPasswordLength).toBe(12);
  });

  it('should have session expiry of 7 days', async () => {
    const { auth } = await import('./auth');
    const session = (auth as unknown as { options: { session: Record<string, unknown> } }).options?.session;
    expect(session?.expiresIn).toBe(60 * 60 * 24 * 7);
  });
});
