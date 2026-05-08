import type { ContractorUser, Job, JobFilters } from './jobs';

export const filterJobs = (
  jobs: Job[],
  filters: JobFilters,
  users: ContractorUser[],
): Job[] => {
  const contractorMap = new Map(users.map((user) => [user.id, user]));
  const query = filters.searchText.trim().toLowerCase();

  return jobs.filter((job) => {
    const contractor = job.contractorId ? contractorMap.get(job.contractorId) : undefined;
    const matchesStatus = filters.status === 'all' || job.status === filters.status;
    const matchesPriority = filters.priority === 'all' || job.priority === filters.priority;
    const matchesContractor =
      filters.contractorId === 'all' || job.contractorId === filters.contractorId;
    const matchesSearch =
      query.length === 0 ||
      [job.id, job.address, job.description, contractor?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query);

    return matchesStatus && matchesPriority && matchesContractor && matchesSearch;
  });
};
