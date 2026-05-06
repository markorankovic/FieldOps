export const jobStatuses = [
  'new',
  'scheduled',
  'in_progress',
  'blocked',
  'completed',
  'cancelled',
] as const;

export const jobPriorities = ['low', 'medium', 'high', 'urgent'] as const;

export type JobStatus = (typeof jobStatuses)[number];
export type JobPriority = (typeof jobPriorities)[number];

export type Contractor = {
  id: string;
  name: string;
  trade: string;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  type: 'created' | 'status_changed' | 'note';
  message: string;
};

export type Job = {
  id: string;
  title: string;
  site: string;
  customer: string;
  contractorId: string;
  status: JobStatus;
  priority: JobPriority;
  scheduledFor: string;
  summary: string;
  audit: AuditEntry[];
};

export type JobFilters = {
  status: JobStatus | 'all';
  priority: JobPriority | 'all';
  contractorId: string | 'all';
  searchText: string;
};

export const statusLabels: Record<JobStatus, string> = {
  new: 'New',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const priorityLabels: Record<JobPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};
