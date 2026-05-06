import type { AuditEntry, Job, JobStatus } from './jobs';

const workflowMap: Record<JobStatus, JobStatus[]> = {
  new: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['blocked', 'completed'],
  blocked: ['scheduled', 'in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

const createAuditEntry = (
  type: AuditEntry['type'],
  message: string,
  actor = 'Dispatcher',
): AuditEntry => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  actor,
  type,
  message,
});

export const getAllowedTransitions = (status: JobStatus): JobStatus[] =>
  workflowMap[status];

export const canTransitionStatus = (
  currentStatus: JobStatus,
  nextStatus: JobStatus,
): boolean => workflowMap[currentStatus].includes(nextStatus);

export const updateJobStatus = (
  job: Job,
  nextStatus: JobStatus,
  actor = 'Dispatcher',
): Job => {
  if (!canTransitionStatus(job.status, nextStatus)) {
    return job;
  }

  return {
    ...job,
    status: nextStatus,
    audit: [
      createAuditEntry(
        'status_changed',
        `Status changed from ${job.status.replace('_', ' ')} to ${nextStatus.replace('_', ' ')}.`,
        actor,
      ),
      ...job.audit,
    ],
  };
};

export const createJobCreatedEntry = (message: string): AuditEntry =>
  createAuditEntry('created', message, 'System');
