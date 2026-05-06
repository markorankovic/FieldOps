import { describe, expect, it } from 'vitest';
import { mockJobs } from '../data/mockJobs';
import type { JobFilters } from './jobs';
import { loadFilters, loadJobs, saveFilters, saveJobs } from './persistence';

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  values: Record<string, string>;
};

const createMemoryStorage = (): MemoryStorage => {
  const values: Record<string, string> = {};

  return {
    values,
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value;
    },
  };
};

const fallbackFilters: JobFilters = {
  status: 'all',
  priority: 'all',
  contractorId: 'all',
  searchText: '',
};

describe('persistence', () => {
  it('loads persisted jobs when storage contains a valid job array', () => {
    const storage = createMemoryStorage();

    saveJobs(storage, mockJobs);

    expect(loadJobs(storage, [])).toEqual(mockJobs);
  });

  it('falls back to mock jobs when persisted jobs are invalid', () => {
    const storage = createMemoryStorage();
    storage.setItem('fieldops.jobs', JSON.stringify([{ id: 'broken-job' }]));

    expect(loadJobs(storage, mockJobs)).toEqual(mockJobs);
  });

  it('loads persisted filters when storage contains valid filter state', () => {
    const storage = createMemoryStorage();
    const storedFilters: JobFilters = {
      status: 'blocked',
      priority: 'high',
      contractorId: 'ctr-3',
      searchText: 'riverside',
    };

    saveFilters(storage, storedFilters);

    expect(loadFilters(storage, fallbackFilters)).toEqual(storedFilters);
  });

  it('falls back to default filters when persisted filters are invalid', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'fieldops.filters',
      JSON.stringify({
        status: 'unknown',
        priority: 'all',
        contractorId: 'all',
        searchText: '',
      }),
    );

    expect(loadFilters(storage, fallbackFilters)).toEqual(fallbackFilters);
  });
});
