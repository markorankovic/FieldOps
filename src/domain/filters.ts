import type { Contractor, Job, JobFilters } from './jobs';

export const filterJobs = (
  jobs: Job[],
  filters: JobFilters,
  contractors: Contractor[],
): Job[] => {
  const contractorMap = new Map(contractors.map((contractor) => [contractor.id, contractor]));
  const query = filters.searchText.trim().toLowerCase();

  return jobs.filter((job) => {
    const contractor = contractorMap.get(job.contractorId);
    const matchesStatus = filters.status === 'all' || job.status === filters.status;
    const matchesPriority = filters.priority === 'all' || job.priority === filters.priority;
    const matchesContractor =
      filters.contractorId === 'all' || job.contractorId === filters.contractorId;
    const matchesSearch =
      query.length === 0 ||
      [job.id, job.title, job.site, job.customer, contractor?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query);

    return matchesStatus && matchesPriority && matchesContractor && matchesSearch;
  });
};
