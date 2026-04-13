import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@kura/db', () => ({
  authUser: {
    id: 'id',
    name: 'name',
    email: 'email',
    role: 'role',
    disabled: 'disabled',
    structureId: 'structure_id',
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { GET } from './route';

describe('GET /api/v1/team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 NO_STRUCTURE when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const request = new NextRequest('http://localhost:3000/api/v1/team');
    const response = await GET(request);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: { code: string } };
    expect(body.error.code).toBe('NO_STRUCTURE');
  });

  it('should return 403 NO_STRUCTURE when structureId is null', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'user@example.com', role: 'idel', structureId: null },
    } as never);
    const request = new NextRequest('http://localhost:3000/api/v1/team');
    const response = await GET(request);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: { code: string } };
    expect(body.error.code).toBe('NO_STRUCTURE');
  });

  it('should return 200 with members for user with structureId (idel role)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '123', email: 'idel@example.com', role: 'idel', structureId: 'struct-01' },
    } as never);
    const mockMembers = [
      { id: '123', name: 'IDEL User', email: 'idel@example.com', role: 'idel', disabled: false },
      { id: '456', name: 'Admin User', email: 'admin@example.com', role: 'admin', disabled: false },
    ];
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockMembers),
    };
    vi.mocked(db).select = mockSelect.select;
    mockSelect.select.mockReturnValue(mockSelect);

    const request = new NextRequest('http://localhost:3000/api/v1/team');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json() as { data: { members: { id: string; isSelf: boolean }[] } };
    expect(body.data.members).toHaveLength(2);
    const self = body.data.members.find((m) => m.id === '123');
    expect(self?.isSelf).toBe(true);
    const other = body.data.members.find((m) => m.id === '456');
    expect(other?.isSelf).toBe(false);
  });

  it('should return 200 with members for doctor role (accessible to all roles)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '789', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
    } as never);
    const mockMembers = [
      { id: '789', name: 'Doctor', email: 'doctor@example.com', role: 'doctor', disabled: false },
    ];
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockMembers),
    };
    vi.mocked(db).select = mockSelect.select;
    mockSelect.select.mockReturnValue(mockSelect);

    const request = new NextRequest('http://localhost:3000/api/v1/team');
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
