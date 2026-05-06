import { describe, expect, it } from 'vitest';
import { contractors, mockJobs } from '../data/mockJobs';
import { filterJobs } from './filters';
import type { JobFilters } from './jobs';

const baseFilters: JobFilters = {
  status: 'all',
  priority: 'all',
  contractorId: 'all',
  searchText: '',
};

describe('filterJobs', () => {
  it('returns all jobs when filters are clear', () => {
    expect(filterJobs(mockJobs, baseFilters, contractors)).toHaveLength(mockJobs.length);
  });

  it('filters by status, priority, and contractor together', () => {
    const result = filterJobs(
      mockJobs,
      {
        ...baseFilters,
        status: 'in_progress',
        priority: 'urgent',
        contractorId: 'ctr-3',
      },
      contractors,
    );

    expect(result.map((job) => job.id)).toEqual(['JOB-1043']);
  });

  it('matches search text against job details and contractor name', () => {
    expect(
      filterJobs(
        mockJobs,
        {
          ...baseFilters,
          searchText: 'maya patel',
        },
        contractors,
      ).map((job) => job.id),
    ).toEqual(['JOB-1042']);

    expect(
      filterJobs(
        mockJobs,
        {
          ...baseFilters,
          searchText: 'warehouse',
        },
        contractors,
      ).map((job) => job.id),
    ).toEqual(['JOB-1042']);
  });

  it('ignores surrounding whitespace in search text', () => {
    expect(
      filterJobs(
        mockJobs,
        {
          ...baseFilters,
          searchText: '  maple court  ',
        },
        contractors,
      ).map((job) => job.id),
    ).toEqual(['JOB-1043']);
  });
});
