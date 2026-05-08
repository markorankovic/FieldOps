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
export type UserRole = 'ADMIN' | 'CONTRACTOR';

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ContractorUser = UserSummary & {
  role: 'CONTRACTOR';
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  type: 'assignment' | 'created' | 'status_changed' | 'note';
  message: string;
};

export type Job = {
  id: string;
  address: string;
  description: string;
  contractorId: string | null;
  status: JobStatus;
  priority: JobPriority;
  scheduledFor: string;
  updatedAt: string;
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
