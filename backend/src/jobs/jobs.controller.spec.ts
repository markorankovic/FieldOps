import { JobStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { AuthenticatedUser } from '../auth/auth.types';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    name: 'Ava Dispatcher',
    email: 'admin@fieldops.local',
    role: 'ADMIN',
  };

  const jobsService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    assignJob: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: jobsService,
        },
      ],
    }).compile();

    controller = moduleRef.get(JobsController);
  });

  it('returns all jobs', async () => {
    jobsService.findAll.mockResolvedValueOnce([{ id: 'job-1' }]);

    await expect(controller.findAll(adminUser)).resolves.toEqual([{ id: 'job-1' }]);
  });

  it('returns a job by id', async () => {
    jobsService.findById.mockResolvedValueOnce({ id: 'job-1' });

    await expect(controller.findById('job-1', adminUser)).resolves.toEqual({ id: 'job-1' });
  });

  it('updates a job status', async () => {
    jobsService.updateStatus.mockResolvedValueOnce({ id: 'job-1', status: JobStatus.IN_PROGRESS });

    await expect(
      controller.updateStatus(
        'job-1',
        {
          status: JobStatus.IN_PROGRESS,
        },
        adminUser,
      ),
    ).resolves.toEqual({ id: 'job-1', status: JobStatus.IN_PROGRESS });
  });

  it('assigns a job', async () => {
    jobsService.assignJob.mockResolvedValueOnce({
      id: 'job-1',
      assignedUser: { id: 'user-2' },
    });

    await expect(
      controller.assignJob('job-1', { assignedUserId: 'user-2' }, adminUser),
    ).resolves.toEqual({
      id: 'job-1',
      assignedUser: { id: 'user-2' },
    });
  });
});
