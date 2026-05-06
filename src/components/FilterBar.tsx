import { jobPriorities, jobStatuses, type Contractor, type JobFilters } from '../domain/jobs';

type FilterBarProps = {
  contractors: Contractor[];
  filters: JobFilters;
  onFiltersChange: (nextFilters: JobFilters) => void;
  onResetFilters: () => void;
};

type ActiveFilterChip = {
  key: keyof JobFilters;
  label: string;
  clearValue: JobFilters[keyof JobFilters];
};

export const FilterBar = ({
  contractors,
  filters,
  onFiltersChange,
  onResetFilters,
}: FilterBarProps) => {
  const updateFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const activeChips: ActiveFilterChip[] = [
    filters.status !== 'all'
      ? { key: 'status', label: `Status: ${filters.status.replace('_', ' ')}`, clearValue: 'all' }
      : null,
    filters.priority !== 'all'
      ? { key: 'priority', label: `Priority: ${filters.priority}`, clearValue: 'all' }
      : null,
    filters.contractorId !== 'all'
      ? {
          key: 'contractorId',
          label: `Contractor: ${contractors.find((contractor) => contractor.id === filters.contractorId)?.name ?? filters.contractorId}`,
          clearValue: 'all',
        }
      : null,
    filters.searchText.trim().length > 0
      ? { key: 'searchText', label: `Search: ${filters.searchText.trim()}`, clearValue: '' }
      : null,
  ].filter((chip): chip is ActiveFilterChip => chip !== null);

  return (
    <section className="filter-bar panel">
      <div className="filter-controls">
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
      </div>

      <div className="filter-meta">
        <div className="filter-chips" aria-label="Active filters">
          {activeChips.length > 0 ? (
            activeChips.map((chip) => (
              <button
                key={chip.label}
                className="filter-chip"
                type="button"
                onClick={() => updateFilter(chip.key, chip.clearValue as never)}
              >
                {chip.label} <span aria-hidden="true">x</span>
              </button>
            ))
          ) : (
            <span className="muted-text">No active filters</span>
          )}
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={onResetFilters}
          disabled={activeChips.length === 0}
        >
          Reset filters
        </button>
      </div>
    </section>
  );
};
