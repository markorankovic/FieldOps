import { jobPriorities, jobStatuses, type Contractor, type JobFilters } from '../domain/jobs';

type FilterBarProps = {
  contractors: Contractor[];
  filters: JobFilters;
  onFiltersChange: (nextFilters: JobFilters) => void;
};

export const FilterBar = ({ contractors, filters, onFiltersChange }: FilterBarProps) => {
  const updateFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <section className="filter-bar">
      <input
        aria-label="Search jobs"
        className="search-input"
        placeholder="Search jobs, sites, customers..."
        type="search"
        value={filters.searchText}
        onChange={(event) => updateFilter('searchText', event.target.value)}
      />

      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(event) => updateFilter('status', event.target.value as JobFilters['status'])}
      >
        <option value="all">All statuses</option>
        {jobStatuses.map((status) => (
          <option key={status} value={status}>
            {status.replace('_', ' ')}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(event) =>
          updateFilter('priority', event.target.value as JobFilters['priority'])
        }
      >
        <option value="all">All priorities</option>
        {jobPriorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by contractor"
        value={filters.contractorId}
        onChange={(event) =>
          updateFilter('contractorId', event.target.value as JobFilters['contractorId'])
        }
      >
        <option value="all">All contractors</option>
        {contractors.map((contractor) => (
          <option key={contractor.id} value={contractor.id}>
            {contractor.name}
          </option>
        ))}
      </select>
    </section>
  );
};
