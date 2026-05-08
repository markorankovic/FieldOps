import type { ContractorUser, Job } from '../domain/jobs';
import { createJobCreatedEntry } from '../domain/workflow';

export const contractors: ContractorUser[] = [
  { id: 'ctr-1', name: 'Maya Patel', email: 'maya@example.com', role: 'CONTRACTOR' },
  { id: 'ctr-2', name: 'Lewis Grant', email: 'lewis@example.com', role: 'CONTRACTOR' },
  { id: 'ctr-3', name: 'Sofia Alvarez', email: 'sofia@example.com', role: 'CONTRACTOR' },
];

export const mockJobs: Job[] = [
  {
    id: 'JOB-1042',
    address: 'North Yard Warehouse',
    description:
      'Replace damaged loading bay lights and confirm safety compliance after a power surge.',
    contractorId: 'ctr-1',
    status: 'scheduled',
    priority: 'high',
    scheduledFor: '2026-05-08T09:00:00.000Z',
    updatedAt: '2026-05-08T08:00:00.000Z',
    audit: [createJobCreatedEntry('Job created and assigned to Maya Patel.')],
  },
  {
    id: 'JOB-1043',
    address: 'Maple Court Apartments',
    description:
      'Investigate boiler pressure drop and inspect the pressure valve, expansion vessel, and pipework.',
    contractorId: 'ctr-3',
    status: 'in_progress',
    priority: 'urgent',
    scheduledFor: '2026-05-06T12:30:00.000Z',
    updatedAt: '2026-05-06T12:45:00.000Z',
    audit: [createJobCreatedEntry('Urgent job created after tenant escalation.')],
  },
  {
    id: 'JOB-1044',
    address: 'Brunswick House',
    description:
      'Repair the reception desk drawer runners and check neighboring fittings.',
    contractorId: 'ctr-2',
    status: 'new',
    priority: 'medium',
    scheduledFor: '2026-05-09T14:00:00.000Z',
    updatedAt: '2026-05-08T10:30:00.000Z',
    audit: [createJobCreatedEntry('Job logged from weekly facilities review.')],
  },
  {
    id: 'JOB-1045',
    address: 'Riverside Cafe',
    description:
      'Clear a blocked kitchen sink line after access is restored by the site manager.',
    contractorId: 'ctr-3',
    status: 'blocked',
    priority: 'high',
    scheduledFor: '2026-05-07T08:00:00.000Z',
    updatedAt: '2026-05-07T08:15:00.000Z',
    audit: [createJobCreatedEntry('Access issue recorded after first site visit.')],
  },
  {
    id: 'JOB-1046',
    address: 'King Street Retail Unit',
    description:
      'Complete the storefront signage installation and confirm alignment against the approved drawing.',
    contractorId: 'ctr-2',
    status: 'completed',
    priority: 'low',
    scheduledFor: '2026-05-05T10:00:00.000Z',
    updatedAt: '2026-05-05T13:00:00.000Z',
    audit: [createJobCreatedEntry('Installation work order raised from fit-out plan.')],
  },
];
