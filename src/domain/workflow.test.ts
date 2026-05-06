import { describe, expect, it } from 'vitest';
import { mockJobs } from '../data/mockJobs';
import {
  canTransitionStatus,
  createJobCreatedEntry,
  getAllowedTransitions,
  updateJobStatus,
} from './workflow';

describe('workflow', () => {
  it('returns the allowed next statuses for a job state', () => {
    expect(getAllowedTransitions('blocked')).toEqual([
      'scheduled',
      'in_progress',
      'cancelled',
    ]);
    expect(getAllowedTransitions('completed')).toEqual([]);
  });

  it('validates status transitions centrally', () => {
    expect(canTransitionStatus('new', 'scheduled')).toBe(true);
    expect(canTransitionStatus('new', 'completed')).toBe(false);
  });

  it('updates the job status and prepends an audit entry for valid transitions', () => {
    const job = mockJobs[0];
    const updatedJob = updateJobStatus(job, 'in_progress', 'Maya Patel');

    expect(updatedJob).not.toBe(job);
    expect(updatedJob.status).toBe('in_progress');
    expect(updatedJob.audit).toHaveLength(job.audit.length + 1);
    expect(updatedJob.audit[0]).toMatchObject({
      actor: 'Maya Patel',
      type: 'status_changed',
      message: 'Status changed from scheduled to in progress.',
    });
  });

  it('returns the original job for invalid transitions', () => {
    const job = mockJobs[2];

    expect(updateJobStatus(job, 'completed')).toBe(job);
  });

  it('creates system audit entries for new jobs', () => {
    expect(createJobCreatedEntry('Job created.')).toMatchObject({
      actor: 'System',
      type: 'created',
      message: 'Job created.',
    });
  });
});
