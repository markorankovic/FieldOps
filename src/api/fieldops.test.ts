import { describe, expect, it, vi, afterEach } from 'vitest';
import { ApiError, getCurrentUser, getJobs, login } from './fieldops';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fieldops api client', () => {
  it('maps login responses to a safe frontend user shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'token-123',
          user: {
            id: 'user-1',
            name: 'Ava Dispatcher',
            email: 'admin@fieldops.local',
            role: 'ADMIN',
          },
        }),
      }),
    );

    await expect(login('admin@fieldops.local', 'demo-admin')).resolves.toEqual({
      accessToken: 'token-123',
      user: {
        id: 'user-1',
        name: 'Ava Dispatcher',
        email: 'admin@fieldops.local',
        role: 'ADMIN',
      },
    });
  });

  it('maps jobs API responses into frontend job objects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'job-1',
            address: 'North Yard Warehouse',
            description: 'Replace damaged loading bay lights.',
            priority: 'HIGH',
            status: 'SCHEDULED',
            scheduledDate: '2026-05-08T09:00:00.000Z',
            updatedAt: '2026-05-08T09:00:00.000Z',
            assignedUser: {
              id: 'user-2',
              name: 'Maya Patel',
              email: 'maya@fieldops.local',
              role: 'CONTRACTOR',
            },
            auditEntries: [
              {
                id: 'audit-1',
                action: 'STATUS_CHANGED',
                fromStatus: 'NEW',
                toStatus: 'SCHEDULED',
                createdAt: '2026-05-08T08:00:00.000Z',
                actorUser: {
                  id: 'user-1',
                  name: 'Ava Dispatcher',
                  email: 'admin@fieldops.local',
                  role: 'ADMIN',
                },
              },
              {
                id: 'audit-2',
                action: 'JOB_ASSIGNED',
                fromStatus: null,
                toStatus: null,
                createdAt: '2026-05-08T07:30:00.000Z',
                actorUser: {
                  id: 'user-1',
                  name: 'Ava Dispatcher',
                  email: 'admin@fieldops.local',
                  role: 'ADMIN',
                },
              },
            ],
          },
        ],
      }),
    );

    await expect(getJobs('token-123')).resolves.toMatchObject([
      {
        id: 'job-1',
        address: 'North Yard Warehouse',
        description: 'Replace damaged loading bay lights.',
        contractorId: 'user-2',
        priority: 'high',
        status: 'scheduled',
        audit: [
          {
            actor: 'Ava Dispatcher',
            type: 'status_changed',
            message: 'Status changed from new to scheduled.',
          },
          {
            actor: 'Ava Dispatcher',
            type: 'assignment',
            message: 'Assigned to Maya Patel.',
          },
        ],
      },
    ]);
  });

  it('throws ApiError with server messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid email or password.' }),
      }),
    );

    await expect(getCurrentUser('bad-token')).rejects.toEqual(
      new ApiError(401, 'Invalid email or password.'),
    );
  });
});
