import { JobStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;

  const jobsService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
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

    await expect(controller.findAll()).resolves.toEqual([{ id: 'job-1' }]);
  });

  it('returns a job by id', async () => {
    jobsService.findById.mockResolvedValueOnce({ id: 'job-1' });

    await expect(controller.findById('job-1')).resolves.toEqual({ id: 'job-1' });
  });

  it('updates a job status', async () => {
    jobsService.updateStatus.mockResolvedValueOnce({ id: 'job-1', status: JobStatus.IN_PROGRESS });

    await expect(
      controller.updateStatus('job-1', {
        status: JobStatus.IN_PROGRESS,
        actorUserId: 'user-1',
      }),
    ).resolves.toEqual({ id: 'job-1', status: JobStatus.IN_PROGRESS });
  });
});
