import type { Contractor, Job } from '../domain/jobs';
import { createJobCreatedEntry } from '../domain/workflow';

export const contractors: Contractor[] = [
  { id: 'ctr-1', name: 'Maya Patel', trade: 'Electrical' },
  { id: 'ctr-2', name: 'Lewis Grant', trade: 'General Maintenance' },
  { id: 'ctr-3', name: 'Sofia Alvarez', trade: 'Plumbing' },
];

export const mockJobs: Job[] = [
  {
    id: 'JOB-1042',
    title: 'Replace damaged loading bay lights',
    site: 'North Yard Warehouse',
    customer: 'Harbor Freight Logistics',
    contractorId: 'ctr-1',
    status: 'scheduled',
    priority: 'high',
    scheduledFor: '2026-05-08T09:00:00.000Z',
    summary:
      'Three overhead fixtures failed after a power surge. Replace fittings and confirm safety compliance.',
    audit: [createJobCreatedEntry('Job created and assigned to Maya Patel.')],
  },
  {
    id: 'JOB-1043',
    title: 'Investigate boiler pressure drop',
    site: 'Maple Court Apartments',
    customer: 'Crestline Property Group',
    contractorId: 'ctr-3',
    status: 'in_progress',
    priority: 'urgent',
    scheduledFor: '2026-05-06T12:30:00.000Z',
    summary:
      'Tenant reports intermittent hot water. Inspect pressure valve, expansion vessel, and visible pipework.',
    audit: [createJobCreatedEntry('Urgent job created after tenant escalation.')],
  },
  {
    id: 'JOB-1044',
    title: 'Repair reception desk drawer runners',
    site: 'Brunswick House',
    customer: 'Oak & Pine Advisory',
    contractorId: 'ctr-2',
    status: 'new',
    priority: 'medium',
    scheduledFor: '2026-05-09T14:00:00.000Z',
    summary:
      'Front desk storage drawer is detached on one side. Restore movement and check neighboring fittings.',
    audit: [createJobCreatedEntry('Job logged from weekly facilities review.')],
  },
  {
    id: 'JOB-1045',
    title: 'Clear blocked kitchen sink line',
    site: 'Riverside Cafe',
    customer: 'Riverside Hospitality',
    contractorId: 'ctr-3',
    status: 'blocked',
    priority: 'high',
    scheduledFor: '2026-05-07T08:00:00.000Z',
    summary:
      'Access limited until site manager arrives with key to under-counter cabinet. Follow-up needed.',
    audit: [createJobCreatedEntry('Access issue recorded after first site visit.')],
  },
  {
    id: 'JOB-1046',
    title: 'Complete storefront signage installation',
    site: 'King Street Retail Unit',
    customer: 'Northline Fashion',
    contractorId: 'ctr-2',
    status: 'completed',
    priority: 'low',
    scheduledFor: '2026-05-05T10:00:00.000Z',
    summary:
      'Install final acrylic letters and confirm alignment against approved elevation drawing.',
    audit: [createJobCreatedEntry('Installation work order raised from fit-out plan.')],
  },
];
