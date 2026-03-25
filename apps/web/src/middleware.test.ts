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

  it('should redirect to /login when no session on protected route', async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('should allow access to protected route with valid session', async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: '123', email: 'test@example.com' },
    });
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });
});
