import type {
  ContractorUser,
  Job,
  JobPriority,
  JobStatus,
  UserRole,
  UserSummary,
} from '../domain/jobs';

const apiBaseUrl = '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type ApiAuditEntry = {
  id: string;
  action: 'STATUS_CHANGED' | 'JOB_ASSIGNED' | 'JOB_CREATED';
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
  actorUser: ApiUser;
};

type ApiJob = {
  id: string;
  address: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NEW' | 'SCHEDULED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  updatedAt: string;
  assignedUser: ApiUser | null;
  auditEntries: ApiAuditEntry[];
};

type LoginResponse = {
  accessToken: string;
  user: ApiUser;
};

const statusMap: Record<ApiJob['status'], JobStatus> = {
  NEW: 'new',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const reverseStatusMap: Record<JobStatus, ApiJob['status']> = {
  new: 'NEW',
  scheduled: 'SCHEDULED',
  in_progress: 'IN_PROGRESS',
  blocked: 'BLOCKED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

const priorityMap: Record<ApiJob['priority'], JobPriority> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

const formatAuditMessage = (
  entry: ApiAuditEntry,
  assignedUser: ApiUser | null,
): string => {
  switch (entry.action) {
    case 'STATUS_CHANGED':
      return `Status changed from ${entry.fromStatus?.toLowerCase().replace('_', ' ')} to ${entry.toStatus?.toLowerCase().replace('_', ' ')}.`;
    case 'JOB_ASSIGNED':
      return `Assigned to ${assignedUser?.name ?? 'contractor'}.`;
    case 'JOB_CREATED':
      return 'Job created.';
  }
};

const mapApiUser = (user: ApiUser): UserSummary => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const mapApiJob = (job: ApiJob): Job => ({
  id: job.id,
  address: job.address,
  description: job.description,
  contractorId: job.assignedUser?.id ?? null,
  status: statusMap[job.status],
  priority: priorityMap[job.priority],
  scheduledFor: job.scheduledDate,
  updatedAt: job.updatedAt,
  audit: job.auditEntries.map((entry) => ({
    id: entry.id,
    timestamp: entry.createdAt,
    actor: entry.actorUser.name,
    type:
      entry.action === 'JOB_CREATED'
        ? 'created'
        : entry.action === 'JOB_ASSIGNED'
          ? 'assignment'
          : 'status_changed',
    message: formatAuditMessage(entry, job.assignedUser),
  })),
});

const readErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    return data.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
};

const request = async <T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  return (await response.json()) as T;
};

export const login = async (email: string, password: string) => {
  const response = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return {
    accessToken: response.accessToken,
    user: mapApiUser(response.user),
  };
};

export const getCurrentUser = async (token: string): Promise<UserSummary> => {
  const response = await request<ApiUser>('/auth/me', undefined, token);
  return mapApiUser(response);
};

export const getJobs = async (token: string): Promise<Job[]> => {
  const response = await request<ApiJob[]>('/jobs', undefined, token);
  return response.map(mapApiJob);
};

export const updateJobStatus = async (
  token: string,
  jobId: string,
  status: JobStatus,
): Promise<Job> => {
  const response = await request<ApiJob>(
    `/jobs/${jobId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: reverseStatusMap[status] }),
    },
    token,
  );

  return mapApiJob(response);
};

export const getContractors = async (token: string): Promise<ContractorUser[]> => {
  const response = await request<ApiUser[]>('/users?role=CONTRACTOR', undefined, token);
  return response.map((user) => mapApiUser(user) as ContractorUser);
};

export const assignJob = async (
  token: string,
  jobId: string,
  assignedUserId: string,
): Promise<Job> => {
  const response = await request<ApiJob>(
    `/jobs/${jobId}/assign`,
    {
      method: 'PATCH',
      body: JSON.stringify({ assignedUserId }),
    },
    token,
  );

  return mapApiJob(response);
};
