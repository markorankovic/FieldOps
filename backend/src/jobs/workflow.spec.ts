import { JobStatus } from '@prisma/client';
import { canTransitionStatus, getAllowedTransitions } from './workflow';

describe('jobs workflow', () => {
  it('returns allowed transitions for a given status', () => {
    expect(getAllowedTransitions(JobStatus.BLOCKED)).toEqual([
      JobStatus.SCHEDULED,
      JobStatus.IN_PROGRESS,
      JobStatus.CANCELLED,
    ]);
    expect(getAllowedTransitions(JobStatus.COMPLETED)).toEqual([]);
  });

  it('allows only valid status transitions', () => {
    expect(canTransitionStatus(JobStatus.NEW, JobStatus.SCHEDULED)).toBe(true);
    expect(canTransitionStatus(JobStatus.NEW, JobStatus.COMPLETED)).toBe(false);
  });
});
