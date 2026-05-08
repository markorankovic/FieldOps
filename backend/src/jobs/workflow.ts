import { JobStatus } from '@prisma/client';

const workflowMap: Record<JobStatus, JobStatus[]> = {
  NEW: [JobStatus.SCHEDULED, JobStatus.CANCELLED],
  SCHEDULED: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
  IN_PROGRESS: [JobStatus.BLOCKED, JobStatus.COMPLETED],
  BLOCKED: [JobStatus.SCHEDULED, JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export const getAllowedTransitions = (status: JobStatus): JobStatus[] =>
  workflowMap[status];

export const canTransitionStatus = (
  currentStatus: JobStatus,
  nextStatus: JobStatus,
): boolean => workflowMap[currentStatus].includes(nextStatus);
