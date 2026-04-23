import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('./lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from './lib/auth';
import { proxy as middleware } from './proxy';

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow access to /api/auth routes without session', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/sign-in/email');
    const response = await middleware(request);
    expect(response.status).not.toBe(307);
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('should allow access to /login without session', async () => {
    const request = new NextRequest('http://localhost:3000/login');
    const response = await middleware(request);
    expect(response.status).not.toBe(307);
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('should redirect to /login with session_expired error when no session on protected route', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('location')).toContain('session_expired');
  });

  it('should allow access to protected route with valid session and structureId', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'test@example.com', structureId: 'struct-01' },
    } as never);
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('should redirect to /onboarding when session exists but structureId is null', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'admin@example.com', structureId: null },
    } as never);
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/onboarding');
  });

  it('should allow access to /onboarding when structureId is null (no redirect loop)', async () => {
    const request = new NextRequest('http://localhost:3000/onboarding');
    const response = await middleware(request);
    expect(response.status).not.toBe(307);
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('should allow API calls when structureId is null (POST /api/v1/structures)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'admin@example.com', structureId: null },
    } as never);
    const request = new NextRequest('http://localhost:3000/api/v1/structures');
    const response = await middleware(request);
    expect(response.status).not.toBe(307);
  });

  it('should return 401 ACCOUNT_DISABLED for disabled user on API route', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'user@example.com', role: 'idel', structureId: 'struct-01', disabled: true },
    } as never);
    const request = new NextRequest('http://localhost:3000/api/v1/patients');
    const response = await middleware(request);
    expect(response.status).toBe(401);
    const body = await response.json() as { error: { code: string } };
    expect(body.error.code).toBe('ACCOUNT_DISABLED');
  });

  it('should redirect disabled user to /login with error param on page route', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'user@example.com', role: 'idel', structureId: 'struct-01', disabled: true },
    } as never);
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('location')).toContain('account_disabled');
  });

  it('should return 403 READ_ONLY_ROLE for doctor role on mutation methods', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
    } as never);
    const request = new NextRequest('http://localhost:3000/api/v1/patients', { method: 'POST' });
    const response = await middleware(request);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: { code: string } };
    expect(body.error.code).toBe('READ_ONLY_ROLE');
  });

  it('should allow GET requests for doctor role', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
    } as never);
    const request = new NextRequest('http://localhost:3000/api/v1/patients');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('should allow POST /api/v1/invitations/accept for doctor role (exception)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
    } as never);
    const request = new NextRequest('http://localhost:3000/api/v1/invitations/accept', { method: 'POST' });
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });
});
