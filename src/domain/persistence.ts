import { jobPriorities, jobStatuses, type Job, type JobFilters, type JobPriority, type JobStatus } from './jobs';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const jobsStorageKey = 'fieldops.jobs';
const filtersStorageKey = 'fieldops.filters';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isJobStatus = (value: unknown): value is JobStatus =>
  typeof value === 'string' && jobStatuses.includes(value as JobStatus);

const isJobPriority = (value: unknown): value is JobPriority =>
  typeof value === 'string' && jobPriorities.includes(value as JobPriority);

const isAuditEntry = (value: unknown): boolean =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.timestamp === 'string' &&
  typeof value.actor === 'string' &&
  ['created', 'status_changed', 'note'].includes(value.type as string) &&
  typeof value.message === 'string';

const isJob = (value: unknown): value is Job =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.site === 'string' &&
  typeof value.customer === 'string' &&
  typeof value.contractorId === 'string' &&
  isJobStatus(value.status) &&
  isJobPriority(value.priority) &&
  typeof value.scheduledFor === 'string' &&
  typeof value.summary === 'string' &&
  Array.isArray(value.audit) &&
  value.audit.every(isAuditEntry);

const isJobFilters = (value: unknown): value is JobFilters =>
  isObject(value) &&
  (value.status === 'all' || isJobStatus(value.status)) &&
  (value.priority === 'all' || isJobPriority(value.priority)) &&
  (value.contractorId === 'all' || typeof value.contractorId === 'string') &&
  typeof value.searchText === 'string';

const readStoredValue = <T>(
  storage: StorageLike | null,
  key: string,
  isValid: (value: unknown) => value is T,
): T | null => {
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    return isValid(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

const writeStoredValue = (storage: StorageLike | null, key: string, value: unknown) => {
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
};

export const getBrowserStorage = (): StorageLike | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const loadJobs = (storage: StorageLike | null, fallbackJobs: Job[]): Job[] =>
  readStoredValue<Job[]>(storage, jobsStorageKey, (value): value is Job[] =>
    Array.isArray(value) && value.every(isJob),
  ) ?? fallbackJobs;

export const saveJobs = (storage: StorageLike | null, jobs: Job[]) => {
  writeStoredValue(storage, jobsStorageKey, jobs);
};

export const loadFilters = (
  storage: StorageLike | null,
  fallbackFilters: JobFilters,
): JobFilters => readStoredValue<JobFilters>(storage, filtersStorageKey, isJobFilters) ?? fallbackFilters;

export const saveFilters = (storage: StorageLike | null, filters: JobFilters) => {
  writeStoredValue(storage, filtersStorageKey, filters);
};
