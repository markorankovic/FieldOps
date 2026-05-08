import { jobPriorities, jobStatuses, type JobFilters, type JobPriority, type JobStatus } from './jobs';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const filtersStorageKey = 'fieldops.filters';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isJobStatus = (value: unknown): value is JobStatus =>
  typeof value === 'string' && jobStatuses.includes(value as JobStatus);

const isJobPriority = (value: unknown): value is JobPriority =>
  typeof value === 'string' && jobPriorities.includes(value as JobPriority);

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

export const loadFilters = (
  storage: StorageLike | null,
  fallbackFilters: JobFilters,
): JobFilters => readStoredValue<JobFilters>(storage, filtersStorageKey, isJobFilters) ?? fallbackFilters;

export const saveFilters = (storage: StorageLike | null, filters: JobFilters) => {
  writeStoredValue(storage, filtersStorageKey, filters);
};
